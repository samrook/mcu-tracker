<a id="readme-top"></a>

<!-- TABLE OF CONTENTS -->
<!-- <details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details> -->

[![MIT][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

# Marvel Cinematic Universe Rewatch Tracker 

[![MCU Rewatch Tracker Screen Shot](/docs/mcu-tracker.png?raw=true "MCU Rewatch Tracker Screen Shot")](https://mcu.samrook.co.uk)

<!-- ABOUT THE PROJECT -->
## About The Project

Marvel Cinematic Universe rewatch tracker — a local-first, browser-based tool for tracking your MCU movie and TV show rewatching progress at the episode level. It's a lightweight React app that reads your watchlist from a simple list.txt file, stores progress locally in the browser, and lets you export and import your progress between devices.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

* [![React][React.js]][React-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Prerequisites

#### Node
- ##### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- ##### Node installation on Ubuntu
  You can install nodejs and npm easily with apt install, just run the following commands.
    ```sh
      sudo apt update
      sudo apt install nodejs
    ```

- ##### Node installation on Arch Linux
  You can install nodejs and npm easily with pacman, just run the following commands.
    ```sh
      sudo pacman -Sy nodejs
    ```

- ##### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

```
$ node --version
v25.9.0

$ npm --version
11.12.1
```

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

```
$ npm install npm -g
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/samrook/mcu-tracker.git
   ```
2. Install NPM packages
   ```sh
   cd web
   npm install
   ```

### Running the Site

1. Build the watchlist and the site
   ```sh
   node tools/build-watchlist.mjs
   npm run build
   ```
2. To serve the site locally
   ```sh
   npm run serve
   ```
   Or, to host the site, copy the `web/public` folder to a static file server of your choice. 

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

1. Fork the project and clone it to your local machine
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add an amazing feature'`)
4. Push the branch (`git push origin feature/AmazingFeature`)
5. Open a pull request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->
## License

Distributed under the MIT license. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/samrook/mcu-tracker.svg?style=for-the-badge
[contributors-url]: https://github.com/samrook/mcu-tracker/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/samrook/mcu-tracker.svg?style=for-the-badge
[forks-url]: https://github.com/samrook/mcu-tracker/network/members
[stars-shield]: https://img.shields.io/github/stars/samrook/mcu-tracker.svg?style=for-the-badge
[stars-url]: https://github.com/samrook/mcu-tracker/stargazers
[issues-shield]: https://img.shields.io/github/issues/samrook/mcu-tracker.svg?style=for-the-badge
[issues-url]: https://github.com/samrook/mcu-tracker/issues
[license-shield]: https://img.shields.io/github/license/samrook/mcu-tracker.svg?style=for-the-badge
[license-url]: https://github.com/samrook/mcu-tracker/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/samrook
[product-screenshot]: docs/mcu-tracker.png
<!-- Shields.io badges. You can a comprehensive list with many more badges at: https://github.com/inttter/md-badges -->
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/

