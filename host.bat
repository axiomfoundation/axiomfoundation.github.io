ECHO OFF
ECHO Starting Python %1 server
IF "%1"=="2" (
    python -m SimpleHTTPServer
) ELSE IF "%1"=="3" (
    python -m http.server
)

