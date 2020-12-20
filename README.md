# decouverto-ftp-saver
A tool to download files from the website a save them to ftp server.

# Configuration

You will have to create a `.env` file to configurate the mail service:
```dosini
MAIL_SERVICE=gmail
MAIL_AUTH_USER=example@gmail.com
MAIL_AUTH_PASS=password
RECEIVERS=receiver@example.com,receiver2@example.com
FTP_SERVER_PATH=/Disque dur/decouverto/
FTP_SERVER=mafreebox.freebox.fr
```

If you don't want to use FTP yon can add:
```
ENABLE_FTP=false
```