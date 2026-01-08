<h1 align="center">DoodleDash</h1>

<p align="center">
  <strong>A fun multiplayer drawing and guessing game!</strong>
</p>

![demo](.github/demo.png)

DoodleDash is a free multiplayer pictionary-style game where you draw and guess with friends.
No advertisements, no account needed - just pure drawing fun!

## About

DoodleDash is a rebranded version of the popular drawing game, customized for the Chirp social network.

**Developed by:** Fahad Khan (cybe4sent1nel)

## Features

- 🎨 Real-time multiplayer drawing
- 🌍 Multiple language support
- 🎯 Customizable game settings
- 🔒 Privacy-focused (no tracking)
- 📱 Mobile-friendly interface
- 🆓 Completely free to play

## How to Play

1. Create or join a game room
2. Take turns drawing the given word
3. Others try to guess what you're drawing
4. Earn points for quick guesses and good drawings
5. Have fun!

## Configuration

Configuration is read from environment variables or a `.env` file located in
the working directory.

Available settings:

| Key                                       | Description                                                      | Default | Required |
| ----------------------------------------- | ---------------------------------------------------------------- | ------- | -------- |
| PORT                                      | HTTP port that the server listens to.                            | 8080    | True     |
| NETWORK_ADDRESS                           | TCP address that the server listens to.                          |         | False    |
| ROOT_PATH                                 | Changes the path (after your domain) that the server listens to. |         | False    |
| CORS_ALLOWED_ORIGINS                      |                                                                  | *       | False    |
| CORS_ALLOW_CREDENTIALS                    |                                                                  |         | False    |
| LOBBY_CLEANUP_INTERVAL                    |                                                                  | 90s     | False    |
| LOBBY_CLEANUP_PLAYER_INACTIVITY_THRESHOLD |                                                                  | 75s     | False    |

For more up-to-date configuration, read the
[config.go](/internal/config/config.go) file.

## Docker

It is recommended that you run the server via Docker, as this will rule out
almost all compatibility issues.

Starting from v0.8.5, docker images are only built on tagged pushes. Each git
tag becomes a docker tag, however `latest` will always point to the latest
version released via GitHub.

### Linux Docker

Download the image:

```shell
docker pull biosmarcel/scribble.rs:latest
```

### Windows Docker

Only use this one if you want to run a native Windows container. Otherwise use
the Linux variant, as that's the default mode on Windows:

```shell
docker pull biosmarcel/scribble.rs:windows-latest
```

### Running the Docker container

Run the following, replacing `<port>` with the port you want the container to be
reachable from outside:

```shell
docker run --pull always --env PORT=8080 -p <port>:8080 biosmarcel/scribble.rs:latest
```

For example:

```shell
docker run --pull always --env PORT=8080 -p 80:8080 biosmarcel/scribble.rs:latest
```

Note that you can change `8080` too, but it is the internal port of the
container and you shouldn't have to change it under normal circumstances.

## Building / Running

Dependencies:
  * [go](https://go.dev/doc/install) version 1.23.3 or later
  * [git](https://git-scm.com/) (You can also download a .zip from Github)

In order to download and build, open a terminal and execute:

```shell
git clone https://github.com/scribble-rs/scribble.rs.git
cd scribble.rs
go build ./cmd/scribblers
```

This will produce a portable binary called `scribblers` or `scribblers.exe` if
you are on Windows.

## Pre-compiled binaries

In the [Releases](https://github.com/scribble-rs/scribble.rs/releases) section
you can find the latest stable release.

Alternatively each commit uploads artifacts which will be available for a
certain time.

**Note that these binaries might not necessarily be compatible with your
system. In this case, please use Docker or compile them yourself.**

## nginx 

Since Scribble.rs uses WebSockets, when running it behind an nginx reverse
proxy, you have to configure nginx to support that. You will find an example
configuration on the [related Wiki page](https://github.com/scribble-rs/scribble.rs/wiki/reverse-proxy-(nginx)).

Other reverse proxies may require similar configuration. If you are using a
well known reverse proxy, you are free to contribute a configuration to the
wiki.

## Server-Side Metrics

While there's a Prometheus metrics endpoint at `/v1/metrics`, it currently
doesn't expose a lot of information. If there are any requests for certain data,
I'd be willing to extend it, as long as it doesn't expose any personal data.

While I do have a dashboard for it, my hoster (fly.io) sadly doesn't support
public dashboards right now, so the data will remain closed for now.

## Contributing

There are many ways you can contribute:

* Update / Add documentation in the wiki of the GitHub repository
* Extend this README
* Create feature requests and bug reports
* Solve issues by creating Pull Requests
* Tell your friends about the project

### Translations

For translations, please always use the `en_us.go` as your base. Other
translations might not be up-to-date. This will cause you to have missing keys
or translate obsolete keys.

## Credits

These resources are by people unrelated to the project, whilst not every of
these resources requires attribution as per license, we'll do it either way ;)

If you happen to find a mistake here, please make a PR. If you are one of the
authors and feel like we've wronged you, please reach out.

Some of these were slightly altered if the license allowed it.
Treat each of the files in this repository with the same license terms as the
original file.

* Logo - All rights reserved, excluded from BSD-3 licensing
* Background - All rights reserved, excluded from BSD-3 licensing
* Favicon - All rights reserved, excluded from BSD-3 licensing
* Rubber Icon - Made by [Pixel Buddha](https://www.flaticon.com/authors/pixel-buddha) from [flaticon.com](https://flaticon.com)
* Fill Bucket Icon - Made by [inipagistudio](https://www.flaticon.com/authors/inipagistudio) from [flaticon.com](https://flaticon.com)
* Kicking Icon - [Kicking Icon #309402](https://icon-library.net/icon/kicking-icon-4.html)
* Sound / No sound Icon - Made by Viktor Erikson (If this is you or you know who this is, send me a link to that persons Homepage)
* Profile Icon - Made by [kumakamu](https://www.iconfinder.com/kumakamu)
* [Help Icon](https://www.iconfinder.com/icons/211675/help_icon) - Made by Ionicons
* [Fullscreen Icon](https://www.iconfinder.com/icons/298714/screen_full_icon) - Made by Github
* [Pencil Icon](https://github.com/twitter/twemoji/blob/8e58ae4/svg/270f.svg)
* [Drawing Tablet Pen Icon](https://www.iconfinder.com/icons/8665767/pen_icon)
* [Checkmark Icon](https://commons.wikimedia.org/wiki/File:Green_check_icon_with_gradient.svg)
* [Fill Icon](https://commons.wikimedia.org/wiki/File:Circle-icons-paintcan.svg)
* [Trash Icon](https://www.iconfinder.com/icons/315225/trash_can_icon) - Made by [Yannick Lung](https://yannicklung.com)
* [Undo Icon](https://www.iconfinder.com/icons/308948/arrow_undo_icon) - Made by [Ivan Boyko](https://www.iconfinder.com/visualpharm)
* [Alarmclock Icon](https://www.iconfinder.com/icons/4280508/alarm_outlined_alert_clock_icon) - Made by [Kit of Parts](https://www.iconfinder.com/kitofparts)
* https://www.iconfinder.com/icons/808399/load_turn_turnaround_icon TODO
