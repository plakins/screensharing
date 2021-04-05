# Screen sharing with Kurento

```
$ npm i
$ npm start
```

#### As presentor
1. Open `chromium-extension/manifest.json` and add your own url to `externally_connectable.matches` array
2. In `server.js` file set your own Kurento server url as `ws_uri` on line `30`
3. Upload Screensharing extension to your Chrominum browser from `chromium-extension` folder
4. Active the extension on the tab where you want to use tab caturing by clicking on its icon
5. Click `Presentor` button to start presenation
6. When you have done, click on `Stop` button to end screen sharing

#### As viewer
1. Wait until presentor starts presentaton
2. Click `View` button to start watching
3. Click `Stop` button if you want to exit
