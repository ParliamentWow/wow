interface VideoPlayerProps {
  videoUrl: string;
  isLive: boolean;
}

export default function VideoPlayer({ videoUrl, isLive }: VideoPlayerProps) {
  return (
    <div className="video-player relative">
      <video src={videoUrl} controls autoPlay={isLive} className="w-full">
        Your browser does not support the video tag.
      </video>
      {isLive && (
        <span className="live-indicator absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded">
          LIVE
        </span>
      )}
    </div>
  );
}
