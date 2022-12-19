import React from 'react';
import { Progress } from '@nextui-org/react';
import Layout from '../components/Layout';
import LocalText from '../components/translation/LocalText';
import L from '../locales/translations/migration.json';
import { ipcRenderer } from 'electron';

function Migration({ isOverlayShown, setIsOverlayShown }) {
  const [ progress, setProgress ] = React.useState(0);
  const [ progressState, setProgressState ] = React.useState("Fetching old config files...");
  const [ estTime, setEstTime ] = React.useState("");

  React.useEffect(() => {
    ipcRenderer.once('estMigrationTime', (event, args) => {
      setEstTime(args);
    });

    ipcRenderer.on('migrateProgressUpdate', (event, args) => {
      var { message, num } = args;
      setProgressState(message);
      setProgress(num);
    });
  });

  return (
    <Layout setup={false} migrate={true} classNames={'overflow-hidden'} setIsOverlayShown={setIsOverlayShown} isOverlayShown={isOverlayShown}>
      <div 
        className='h-full w-full relative p-2 pl-4 pr-4'
        id='pg-1'
      >
        <h2 className='text-lg'>{LocalText(L, 'header')}</h2>
        <hr className='mb-2' />
        <p className='mb-2'>{LocalText(L, 'desc', estTime)}</p>
        <div className='h-1/2 w-5/6 mx-auto flex flex-col justify-center items-center'>
          <p className='mb-4'>{LocalText(L, 'estTime', estTime)}</p>
          <Progress value={progress} max={100} color="gradient" size={'xs'} className={'bg-tile-color rounded mb-4'} />
          <span>{progressState}</span>
        </div>
        <p className='absolute bottom-2 left-4 text-gray-500'>{LocalText(L, 'footer')}</p>
      </div>
    </Layout>
  );
}

export default Migration;