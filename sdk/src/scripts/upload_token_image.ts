import {upload} from "../utils/walrus";

upload('./assets/quantum.webp', 3).then(console.log).catch(console.error)