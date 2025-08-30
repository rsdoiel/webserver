%webserver(1) user manual

# NAME

webserver

# SYNOPSIS

webserver [OPTION] [HTDOCS_DIRECTORY] [PORT]

# DESCRIPTION

webserver provides a simple static localhost web service. By default the services
are provided on port 8000, so your web browser would use the url
'http://localhost:8000' for access. By default {appName} looks for
htdocs in the current working directory. If you provide a
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
webserver ./ 8001
~~~
  

