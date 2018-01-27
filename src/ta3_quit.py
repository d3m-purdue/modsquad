import psutil

# This is called to look up and stop the TA3 server.  The TA3
# is being executed by tangelo ()


# look through the system processes to find 'tangelo'
for proc in psutil.process_iter():
    if proc.name() == 'tangelo':
        print 'killing ',proc.name()
        # once found, kill this process to stop the webserver
        proc.kill()


