import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFullscreen, usePromise, useToggle } from "react-use";
import YouTube, { YouTubePlayer, YouTubeProps } from "react-youtube";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";

import {
  ArrowUturnLeftIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/20/solid";
import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  ExclamationTriangleIcon,
  TvIcon,
} from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/solid";

import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import useIsMobile from "../hooks/isMobile";
import { useKaraokeState } from "../hooks/karaoke";
import { useRoomState } from "../hooks/room";
import { ACTION, SocketData } from "../types/socket";
import { joinRoom, leaveRoom, socket } from "../utils/socket";
import Alert, { AlertHandler } from "./Alert";
import BottomAds from "./BottomAds";
import VideoAds from "./VideoAds";

function YoutubePlayer({
  videoId,
  nextSong,
  className = "",
  extra = null,
  isMoniter = false,
}) {
  const router = useRouter();
  const playerRef = useRef<YouTube>();
  const fullscreenRef = useRef<HTMLDivElement>();
  const [show, toggleFullscreen] = useToggle(false);
  const isFullscreen = useFullscreen(fullscreenRef, show, {
    onClose: () => toggleFullscreen(false),
  });
  const [playerState, setPlayerState] = useState<number>();
  const { user } = useAuth();
  const isLogin = !!user.uid;

  const [isFullScreenIphone, setIsFullScreenIphone] = useState<boolean>(false);
  const alertRef = useRef<AlertHandler>(null);
  const alertFullNotWorkRef = useRef<AlertHandler>(null);

  const [isIphone, setIsIphone] = useState<boolean>(false);
  const [isRemote, setIsRemote] = useState<boolean>(false);

  const { playlist, curVideoId, setCurVideoId, setPlaylist } =
    useKaraokeState();

  const { room, setRoom } = useRoomState();
  const { addToast } = useToast();
  const isMobile = useIsMobile();

  const [isOpenMonitor, setIsOpenMonitor] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isShowAds, setIsShowAds] = useState(false);
  const [videoCount, setVideoCount] = useState<number>(0);
  const [inputRoomId, setInputRoomId] = useState("");

  const mounted = usePromise();

  const [isMouseMoving, setIsMouseMoving] = useState(true);
  let timeoutId: NodeJS.Timeout;

  const handleMouseMove = () => {
    setIsMouseMoving(true);
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setIsMouseMoving(false);
    }, 3000); // 3 seconds delay before hiding the div
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  const UseFullScreenCss = isFullScreenIphone;
  const isIOS =
    /iPad|iPhone/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  async function updatePlayerState(player: YouTubePlayer) {
    if (!player) return;
    const [muteState, playerState] = await mounted(
      Promise.allSettled([player.isMuted(), player.getPlayerState()])
    );

    // These lines will not execute if this component gets unmounted.
    if (muteState.status === "fulfilled") setIsMuted(muteState.value);
    if (playerState.status === "fulfilled") setPlayerState(playerState.value);
  }

  useEffect(() => {
    if (!!videoId) setVideoCount(videoCount + 1);
  }, [videoId]);

  useEffect(() => {
    // Create a socket connection
    const _room = isMoniter ? (router.query?.room as string) || room : room;

    joinRoom(_room, addToast);

    socket.on("message", (data) => {
      //remote
      if (!isMoniter) {
        if (data.action == ACTION.SET_PLAYLIST_FROM_TV) {
          setPlaylist(data.playlist);
        }
        return;
      }

      //TV
      switch (data.action) {
        case ACTION.PLAY:
          handlePlay();
          break;

        case ACTION.PAUSED:
          handlePause();
          break;

        case ACTION.REPLAY:
          handleReplay();
          break;

        case ACTION.NEXT_SONG:
          nextSong();
          break;

        case ACTION.MUTE:
          handleMute();
          break;

        case ACTION.UNMUTE:
          handleUnMute();
          break;

        case ACTION.SET_PLAYLIST:
          setPlaylist(data.playlist);
          break;

        default:
          break;
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isMoniter)
      socket.on("reqPlaylist", () => {
        socket.emit("message", {
          room,
          action: {
            action: ACTION.SET_PLAYLIST_FROM_TV,
            playlist: playlist,
          },
        });
      });
    return () => {
      socket.off("reqPlaylist");
    };
  }, [playlist, room]);

  useEffect(() => {
    if (playlist?.length && !curVideoId && !isRemote) {
      // playing first video
      const [video, ...newPlaylist] = playlist;
      setCurVideoId(video.videoId);
      // then remove it from playlist
      setPlaylist(newPlaylist);

      socket.emit("message", {
        room: router.query?.room as string,
        action: { action: ACTION.SET_PLAYLIST_FROM_TV, playlist: newPlaylist },
      });
    }
  }, [playlist, curVideoId]);

  useEffect(() => {
    //Play Now
    if (curVideoId && isRemote) {
      socket.emit("message", {
        room,
        action: { action: ACTION.SET_SONG, videoId: curVideoId },
      });
    }
  }, [curVideoId]);

  const sendMessage = (act = ACTION.PLAY, _room?: string) => {
    const roomId = _room || room;

    if (!roomId || isMoniter || !isLogin || !isRemote) return;

    let action: SocketData = { action: act };

    if ([ACTION.PLAY, ACTION.PAUSED, ACTION.SET_SONG].includes(act)) {
      action.videoId = curVideoId;
    }

    if (act === ACTION.SET_PLAYLIST) {
      action.playlist = playlist;
    }

    socket.emit("message", { room: roomId, action });
  };

  useEffect(() => {
    if (!isLogin && videoCount % 1 == 0 && videoCount !== 0) {
      handlePause();
      setIsShowAds(false);
      setTimeout(() => setIsShowAds(true), 200);
    }
  }, [videoCount]);

  // Event handler for triggering fullscreen on a user gesture
  const handleFullscreenButtonClick = () => {
    if (!isIphone && !isFullscreen) {
      alertFullNotWorkRef?.current.open();
    }

    if (
      //@ts-ignore
      fullscreenRef.webkitEnterFullScreen ||
      //@ts-ignore
      fullscreenRef.webkitExitFullscreen
    ) {
      console.log(" Toggle fullscreen in Safari for iPad");
      // Toggle fullscreen in Safari for iPad
      if (!isFullscreen) {
        //@ts-ignore
        fullscreenRef.webkitEnterFullScreen();
        toggleFullscreen(true);
      } else {
        //@ts-ignore
        fullscreenRef.webkitExitFullscreen();
        toggleFullscreen(false);
      }
    } else if (isIphone) {
      setIsFullScreenIphone(!isFullScreenIphone);

      !isFullScreenIphone && alertRef?.current.open();
    } else {
      // Toggle fullscreen for other OS / Devices / Browsers
      console.log("Toggle fullscreen for other OS / Devices / Browsers");
      toggleFullscreen();
      setIsFullScreenIphone(!isFullScreenIphone);
    }
  };

  const handleMute = async () => {
    sendMessage(ACTION.MUTE);
    try {
      const player = playerRef.current?.getInternalPlayer();
      setIsMuted(true);
      if (!player) return;
      await player.mute();
    } catch (error) {
      console.log(error);
    }
  };
  const handleUnMute = async () => {
    sendMessage(ACTION.UNMUTE);
    try {
      const player = playerRef.current?.getInternalPlayer();
      setIsMuted(false);
      if (!player) return;
      await player.unMute();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePlay = async () => {
    try {
      sendMessage(ACTION.PLAY);

      const player = playerRef.current?.getInternalPlayer();

      setPlayerState(YouTube.PlayerState.PLAYING);
      if (!player) return;
      await player?.playVideo();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePause = async () => {
    sendMessage(ACTION.PAUSED);

    try {
      const player = playerRef.current?.getInternalPlayer();

      setPlayerState(YouTube.PlayerState.PAUSED);
      if (!player) return;
      await player.pauseVideo();
    } catch (error) {
      console.log(error);
    }
  };

  const handleReplay = async () => {
    sendMessage(ACTION.REPLAY);
    try {
      const player = playerRef.current?.getInternalPlayer();
      if (!player) return;
      await player.seekTo(0, true);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!isMoniter && isRemote) {
      sendMessage(ACTION.SET_PLAYLIST);
    }
  }, [playlist]);

  const playPauseBtn = [
    playerState === YouTube.PlayerState.PLAYING
      ? {
          icon: PauseIcon,
          label: "หยุด",
          onClick: handlePause,
        }
      : {
          icon: PlayIcon,
          label: "เล่น",
          onClick: handlePlay,
        },
  ];

  const muteBtn = useMemo(
    () => [
      !isMuted
        ? {
            icon: SpeakerWaveIcon,
            label: "ปิดเสียง",
            onClick: handleMute,
          }
        : {
            icon: SpeakerXMarkIcon,
            label: "เปิดเสียง",
            onClick: handleUnMute,
          },
    ],
    [isMuted]
  );

  const fullBtn = useMemo(
    () => [
      (isIphone ? !isFullScreenIphone : !isFullscreen)
        ? {
            icon: ArrowsPointingOutIcon,
            label: "เต็มจอ",
            onClick: async () => {
              handleFullscreenButtonClick();
            },
          }
        : {
            icon: ArrowsPointingInIcon,
            label: "จอเล็ก",
            onClick: async () => {
              handleFullscreenButtonClick();
            },
          },
    ],
    [isFullscreen, isFullScreenIphone, isIphone]
  );

  const playerBtns: any = useMemo(
    () => [
      {
        icon: ForwardIcon,
        label: "เพลงถัดไป",
        onClick: () => {
          if (!isRemote) {
            nextSong();
          } else {
            sendMessage(ACTION.NEXT_SONG);
            if (playlist?.length) {
              // playing first video
              const [video, ...newPlaylist] = playlist;
              setCurVideoId(video.videoId);
            } else {
              // setCurVideoId("");
            }
          }
        },
      },
      {
        icon: ArrowUturnLeftIcon,
        label: "ร้องอีกครั้ง",
        onClick: handleReplay,
      },
    ],
    [nextSong, isRemote, playlist]
  );

  const RemoteComponent = () => {
    return (
      isLogin &&
      !isMoniter && (
        <div
          className={`${
            isRemote
              ? " w-full aspect-video  top-0 right-0 "
              : "w-16 h-16  top-5 right-5  drop-shadow-md rounded-full "
          } bg-primary text-white  z-2 left-auto
    flex items-center justify-center  transition-all duration-50 ${
      !isRemote && playerState === PlayerStates.PLAYING ? "opacity-0" : ""
    }`}
          style={{
            zIndex: 2,
            position: "absolute",
          }}
        >
          <div className="relative">
            {isRemote && (
              <div className="absolute inset-0 flex items-center justify-center  text-xl ">
                {isMobile ? (
                  <div className=" text-sm flex space-y-2 flex-col text-center">
                    <div>
                      คัดลอก URL เพื่อเปิดบน Google Chrome บนหน้าจอที่ 2<br />
                      <span className="font-bold">
                        https://play.okeforyou.com/monitor
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        id="room-id"
                        className="py-2 px-2  block w-full text-black bg-gray-100 rounded-lg text-sm disabled:opacity-50 border-0 disabled:pointer-events-none"
                        placeholder="กรอกเลขห้อง"
                        value={inputRoomId}
                        onChange={(e) => setInputRoomId(e.target.value)}
                      />
                      <button
                        className="absolute right-2 top-2 py-0.5 px-3 text-white rounded-lg bg-primary"
                        onClick={() => {
                          leaveRoom(room);
                          setRoom(inputRoomId);
                          joinRoom(inputRoomId, addToast);

                          sendMessage(ACTION.REMOTE_JOIN, inputRoomId);
                        }}
                      >
                        ยืนยัน
                      </button>
                    </div>
                    <div className="text-sm">
                      Android TV ใช้งาน ผ่าน App : Monitor YouOKE <br />
                      โหมด 2 หน้าจอ เพลงจะเล่นจากคิวที่ค้างบน TV ก่อน
                    </div>
                  </div>
                ) : (
                  <a
                    href={`/monitor?room=${room}`}
                    target="_blank"
                    className="flex flex-col items-center justify-center text-center cursor-pointer "
                  >
                    <TvIcon className="w-10 h-10" />
                    {`เปิดห้อง: ${room}`}
                  </a>
                )}
              </div>
            )}
            <div
              className={`  cursor-pointer   ${
                isRemote ? "absolute top-5 right-5  " : "w-16 h-16  "
              }  flex flex-col items-center justify-center text-center   `}
              onClick={() => {
                setIsRemote(!isRemote);
                handlePause();
              }}
            >
              <TvIcon
                className={`w-8 h-8 ${isRemote ? "opacity-0 hidden none" : ""}`}
              />
              <div
                className={`text-xs ${
                  isRemote ? "bg-white text-primary px-0.5" : ""
                }`}
              >
                {isRemote && "ปิด"} 2 หน้าจอ
              </div>
            </div>
          </div>
        </div>
      )
    );
  };

  const buttons = !isMoniter
    ? playPauseBtn.concat(playerBtns, muteBtn, isRemote ? [] : fullBtn)
    : [
        ...fullBtn,
        {
          icon: ArrowPathIcon,
          label: "เชื่อมต่อใหม่",
          onClick: async () => {
            joinRoom(router.query?.room as string, addToast);
          },
        },
      ];

  return (
    <div
      ref={fullscreenRef}
      id="youtubePlayer"
      className={`${isFullscreen ? "bg-black" : "bg-white"} ${className}`}
    >
      <Alert
        ref={alertRef}
        timer={2000}
        headline="เต็มจอ"
        headlineColor="text-green-600"
        bgColor="bg-green-100"
        content={<span className="text-sm">กดเล่นเพื่อเต็มจอ</span>}
        icon={<PlayIcon />}
      />
      <span className={`${isIOS && !isIphone ? "" : "hidden"}`}>
        <Alert
          ref={alertFullNotWorkRef}
          timer={3000}
          headline="หากไม่เต็มจอ"
          headlineColor="text-green-600"
          bgColor="bg-green-100"
          content={
            <button
              className="text-sm btn btn-ghost"
              onClick={async () => {
                setIsFullScreenIphone(false);
                toggleFullscreen(false);
                setIsIphone(true);
                await handlePause();
              }}
            >
              กดที่นี่แล้วลองอีกครั้ง
            </button>
          }
          icon={<ExclamationTriangleIcon />}
        />
      </span>
      {RemoteComponent()}
      {isMoniter && !isOpenMonitor && (
        <div
          className={` w-full aspect-video   bg-primary text-white  z-2 left-auto
          flex items-center justify-center  transition-all duration-50  `}
          style={{
            zIndex: 2,
            position: "absolute",
          }}
        >
          <div className="relative">
            <div
              className="cursor-pointer  absolute inset-0 flex items-center justify-center  text-xl"
              onClick={() => {
                setIsOpenMonitor(true);
                handlePlay();
              }}
            >
              กดเพื่อเปิดหน้าจอ
            </div>
          </div>
        </div>
      )}
      <div
        className="w-full aspect-video relative flex-1 md:flex-grow-1"
        onClick={() => handleFullscreenButtonClick()}
      >
        {!videoId || isRemote ? (
          <div
            className="h-full w-full flex items-center justify-center bg-black"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Image
              src="/assets/icons/icon.svg"
              width={48}
              height={48}
              className=""
              alt="KaraTube's Logo"
            />
          </div>
        ) : (
          <YouTube
            ref={playerRef}
            videoId={videoId}
            className={`w-full bg-black ${
              !isFullscreen
                ? "aspect-video cursor-zoom-in"
                : "h-[calc(100dvh)] cursor-zoom-out"
            } `}
            iframeClassName={`w-full h-[calc(100dvh)] pointer-events-none`}
            style={{
              width: "100%",
              height: "100%",
              position: UseFullScreenCss ? "fixed" : "absolute",
              zIndex: UseFullScreenCss ? 20 : 0,
            }}
            loading="lazy"
            opts={{
              playerVars: {
                autoplay:
                  isMoniter && playerState === PlayerStates.PAUSED ? 0 : 1,
                controls: 0,
                disablekb: 1,
                enablejsapi: 1,
                modestbranding: 1,
                playsinline: isIphone && isFullScreenIphone ? 0 : 1,
              },
            }}
            onStateChange={(ev) => {
              updatePlayerState(ev.target);
            }}
            onEnd={() => {
              if (isMoniter) {
                nextSong();
              } else {
                if (!isRemote) {
                  nextSong();
                }
              }
            }}
          />
        )}
      </div>

      {!isLogin && !isMoniter && <BottomAds />}
      {!isLogin && !isMoniter && isShowAds && <VideoAds />}

      <div
        className={`flex-shrink-0 flex flex-row md:w-full p-1 items-center z-20 ${
          isMouseMoving ? "hover:opacity-100" : ""
        } ${
          (UseFullScreenCss || !isMouseMoving) &&
          (isFullscreen || isFullScreenIphone)
            ? "opacity-0"
            : ""
        }`}
        style={
          UseFullScreenCss || isMoniter
            ? {
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                background: isMoniter ? "white" : "initial",
              }
            : {}
        }
      >
        {buttons.map((btn) => {
          return (
            <button
              key={btn.label}
              className="btn btn-ghost font-normal text-primary flex h-auto flex-col flex-1 overflow-hidden  text-sm 2xl:text-lg p-0 hover:bg-base-200"
              onClick={btn.onClick}
            >
              <btn.icon className="w-8 h-8 2xl:w-10 2xl:h-10" />
              {btn.label}
            </button>
          );
        })}
        {extra}
      </div>
    </div>
  );
}

export default YoutubePlayer;
