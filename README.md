# Netgear UI

A UI for easily managing the Netgear GS308EP. My motivation for this project is to disable power to PoE devices (WiFi access points) at night to reduce electromagnetic fields (EMFs) in my home.

## Design

This is my raw design prior to implementation.

- UI
    - Password authenticated.
    - Open to the public internet via a Cloudflare tunnel. This makes it easy to access from a phone when the WiFi is off. (I turn my phone off at night.)
    - As a user, I can manually manage PoE status.
    - As a user, I can update the automatic PoE schedule.
    - As a user, I can disable the automatic PoE schedule (for when I am on-call at work).
- Server
    - Stores the encrypted password in a file on disk. Volume mounted into the Docker container.
    - Interacts with a Netgear CLI.
    - Cron schedule to disable PoE at night and enable it in the morning. Use https://www.npmjs.com/package/cron
    - Routes to manually manage PoE status from the UI.
- Netgear CLI
    - Uses https://github.com/nitram509/ntgrrc
    - Git clone, build the binary, and add to Docker image.
    - Volume mounts the `.config` directory.
