
'use client';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
// import 'react-h5-audio-player/lib/styles.less' Use LESS
// import 'react-h5-audio-player/src/styles.scss' Use SASS

const Player = () => (
  <AudioPlayer
    autoPlay
    src="/sample-3s.mp3"
    onPlay={e => console.log("onPlay")}
    // other props here
    className='w-96'
  />
);

export default Player;