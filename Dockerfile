FROM debian:latest
LABEL org.opencontainers.image.title="Bds Maneger Docker" \
  org.opencontainers.image.description="Start Minecraft Server with Docker containers and Auto Control Server wirh Bds Maneger Core." \
  org.opencontainers.image.vendor="Sirherobrine23" \
  org.opencontainers.image.licenses="AGPL-3.0-or-later" \
  org.opencontainers.image.source="https://github.com/The-Bds-Maneger/Container.git"
ARG DEBIAN_FRONTEND="noninteractive"
RUN apt update && apt install -y git curl wget sudo procps zsh tar screen ca-certificates procps lsb-release && apt install -y xdg-utils g++ libatomic1 libnss3 libatk-bridge2.0-0 gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxrandr2 libxrender1 libxss1 libxtst6 fonts-liberation libnss3 libgbm-dev

# Install openjdk
RUN apt update && JAVAVERSIONS="$(apt search openjdk|grep '/'|grep 'openjdk-'|sed 's|/| |g'|awk '{print $1}'|grep 'jre'|sed -e 's|-jre.*||g'|uniq)";case $JAVAVERSIONS in   *17* ) apt install -y openjdk-17*;;   *16* ) apt install -y openjdk-16*;;   *) echo "Unsupported Java Version, avaibles"; echo "$JAVAVERSIONS";exit 0;; esac

# Install latest node
RUN wget -qO- https://raw.githubusercontent.com/Sirherobrine23/DebianNodejsFiles/main/debianInstall.sh | bash

# Install extra libries to Bedrock another archs
RUN case $(uname -m) in x86_64 ) echo "Dont Install libries";exit 0;; * ) apt update; apt install -y qemu-user-static unzip; wget -q "https://github.com/The-Bds-Maneger/external_files/raw/main/Linux/libs_amd64.zip" -O /tmp/tmp.zip; unzip -o /tmp/tmp.zip -d /; rm -rfv /tmp/tmp.zip; apt remove -y --purge unzip;; esac

# Ports
EXPOSE 3000:3000/tcp 25565:25565/tcp 25566:25566/tcp 19132:19132/udp 19133:19133/udp

# Default Run
VOLUME [ "/data/worlds", "/data/backups", "/data/logs", "/data/extra" ]
STOPSIGNAL SIGINT
ENTRYPOINT [ "bash", "-c", "WORLD_STORAGE='/data/worlds' BACKUP_PATH='/data/backups' LOG_PATH='/data/logs' EXTRA_PATH='/data/extra' AUTO_LINK_WORLDS='true' node --trace-warnings dist/index.js" ]

# Server Settings
ENV \
WORLD_NAME="My Map" \
DESCRIPTION="My Server" \
GAMEMODE="survival" \
DIFFICULTY="normal" \
MAXPLAYERS="5" \
REQUIRED_LOGIN="false" \
ALLOW_COMMADS="false" \
CRON_BACKUP="true" \
VERSION="latest" \
PLATFORM="bedrock" \
AUTH_USER="admin" \
AUTH_PASSWORD="admin"

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ ./
RUN npm run build
