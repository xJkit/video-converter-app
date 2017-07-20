const { app, ipcMain, shell } = require('electron');
const MainWindow = require('./app/MainWindow');
const { mainWindowConfig } = require('./app/config');
const ffmpeg = require('fluent-ffmpeg');

let mainWindow;

app.on('ready', () => {
  mainWindow = new MainWindow(mainWindowConfig.windowOptions);
  mainWindow.loadURL(mainWindowConfig.fileUrl);
});


ipcMain.on('video:added', (evt, videos) => {
  const fetchVideoMetadata = video => new Promise((resolve, reject) =>
    ffmpeg.ffprobe(video.path, (err, metadata) => {
      if (err) {
        reject(err);
      }
      resolve(Object.assign({}, video, {
        duration: metadata.format.duration,
        format: 'avi',
      }));
    }));

  Promise.all(videos.map(video => fetchVideoMetadata(video)))
    .then((data) => {
      mainWindow.webContents.send('metadata:complete', data);
      // console.log('succesfully send data from the electron app');
    });
});

ipcMain.on('conversion:start', (evt, videos) => {
  videos.forEach(video => {
    const outputDir = video.path.split(video.name)[0];
    const outputName = video.name.split('.')[0];
    const FQPN = `${outputDir}${outputName}.${video.format}`;
    ffmpeg(video.path)
      .output(FQPN)
      .on('progress', ({ timemark }) => {
        // percent is inaccurate, use timemark instead.
        mainWindow.webContents.send('conversion:progress', { video, timemark });
      })
      .on('end', () => mainWindow.webContents.send('conversion:end', { video, FQPN }))
      .run();
  });
});

ipcMain.on('folder:open', (evt, outputPath) => {
  shell.showItemInFolder(outputPath);
});
