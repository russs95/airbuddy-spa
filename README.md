# airbuddy-spa
The web app for the airBuddy project, running on node, epxress and nuxt.  

Phase A — Start UI immediately (no DB work yet)

Develop Nuxt locally

Deploy static output to /var/www/airbuddy-air2/

Keep air2 /api → 127.0.0.1:3000 for now

Build the UI using whatever endpoints already exist

Phase B — Stand up “air2 API + air2 DB”

Create new MySQL database and user (server-side)

Fork/copy your Express API into a new folder

Point it to the new DB

Run migrations for new schema

Run that API on port 3002 (systemd service)

Update Nginx: air2 /api → 127.0.0.1:3002
