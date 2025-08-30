/**
 * webserver_v4.js - A simple static file server with configurable port and root directory via YAML.
 */
import { parse as parseArgs } from "@std/flags";
import { serveDir } from "@std/http/file-server";
import { parse as parseYaml } from "@std/yaml/parse";
import { exists } from "@std/fs/exists";
import { version, releaseDate, releaseHash, licenseText } from "./version.js"

const appName = "webserver";
const defaultPort = 8000;
const defaultRoot = "htdocs";

// Function to read and parse YAML configuration file
async function readConfigFile(filePath) {
  try {
    const fileContent = await Deno.readTextFile(filePath);
    return parseYaml(fileContent);
  } catch (err) {
    console.error("Error reading or parsing YAML file:", err);
    return null;
  }
}

// displayHelp renders a help page as a CommonMark document suitable for
// turning into a man page using Pandoc.
function displayHelp() {
  console.log(`%${appName}(1) user manual

# NAME

${appName}

# SYNOPSIS

${appName} [OPTION] [HTDOCS_DIRECTORY] [PORT]

# DESCRIPTION

${appName} provides a simple static localhost web service. By default the services
are provided on port ${defaultPort}, so your web browser would use the url
'http://localhost:${defaultPort}' for access. By default {appName} looks for
${defaultRoot} in the current working directory. If you provide a
directory name as a paramater that directory will be used to provide content.
If you include a number as a parameter then that port number will be used by
the service.

# OPTION

-h, --help
: Display this help page.

# EXAMPLE

In this example the web service will listen on port 8001 and serve the content
from the current directory.

~~~
${appName} ./ 8001
~~~
  
`);
}

// Function to parse URL-encoded data
function parseUrlEncodedBody(body) {
  const result = {};
  new URLSearchParams(body).forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

// Start a simple server
async function main() {
  let rootPath = defaultRoot;
  let port = defaultPort;
  const args = parseArgs(Deno.args, {
    boolean: ["help", "version", "license"],
    alias: {
      h: "help",
      v: "version",
      l: "license"
    },
  });

  if (args.help) {
    displayHelp();
    Deno.exit(0);
  }
  if (args.license) {
    console.log(licenseText);
    Deno.exit(0);
  }
  if (args.version) {
    console.log(`${version} ${releaseDate}`);
    Deno.exit(0);
  }

  // Parse command-line arguments
  if (args._.length > 0) {
    // Check for port number and path
    for (const arg of args._) {
      if (/^-?\d+$/.test(arg)) {
        const portArg = parseInt(arg, 10);
        if (!isNaN(portArg)) {
          port = portArg;
        }  else {
          rootPath = arg;
        } 
      } else {
          rootPath = arg;
      }
    }
  } else {
    // Check for YAML configuration file
    const configFilePath = "webserver.yaml";
    if (await exists(configFilePath)) {
      const config = await readConfigFile(configFilePath);
      if (config) {
        rootPath = config.htdocs || defaultRoot;
        port = config.port || defaultPort;
      }
    }
  }

  console.log(
    `Server running on http://localhost:${port}/, serving ${rootPath}`,
  );

  Deno.serve(
    {
      port,
    },
    async (req) => {
      if (req.method === "POST" || req.method === "PUT") {
        console.log(`Unsupported HTTP method ${req.method}`);
        const contentType = req.headers.get("content-type") || "";
        const body = await req.text();

        if (contentType.includes("application/json")) {
          try {
            const jsonBody = JSON.parse(body);
            console.log(
              "Request body (JSON):",
              JSON.stringify(jsonBody, null, 2),
            );
          } catch (err) {
            console.error("Error parsing request body as JSON:", err);
          }
        } else if (contentType.includes("application/x-www-form-urlencoded")) {
          const urlEncodedBody = parseUrlEncodedBody(body);
          console.log(
            "Request body (URL-encoded):",
            JSON.stringify(urlEncodedBody, null, 2),
          );
        } else {
          console.log("Unsupported content type:", contentType);
        }
      } else if (req.method !== "GET") {
        console.log(`Unsupported HTTP method ${req.method}`);
      }

      try {
        // Serve files from the specified directory
        return await serveDir(req, {
          fsRoot: rootPath,
          urlRoot: "",
          showDirListing: true,
          showDotfiles: false, // Exclude files starting with a period
        });
      } catch (err) {
        console.error(err);
        // Return a 404 response if something goes wrong
        return new Response("404: Not Found", { status: 404 });
      }
    },
  );
}

if (import.meta.main) {
  await main();
}
