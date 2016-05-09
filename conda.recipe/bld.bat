CALL npm install --parseable || EXIT /B 1
IF %ERRORLEVEL% NEQ 0 EXIT /B %ERRORLEVEL%
CALL npm run build:release  || EXIT /B 1
IF %ERRORLEVEL% NEQ 0 EXIT /B %ERRORLEVEL%
rmdir "node_modules" /s /q
"%PYTHON%" setup.py install
CALL jupyter nbextension install nbpresent --py --sys-prefix --overwrite || EXIT /B 1
IF %ERRORLEVEL% NEQ 0 EXIT /B %ERRORLEVEL%
