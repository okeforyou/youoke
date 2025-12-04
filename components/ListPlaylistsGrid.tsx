import {
  addDoc,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import Image from "next/image";
import { Fragment, useEffect, useRef, useState } from "react";

import {
  PencilIcon,
  PlusIcon,
  RectangleStackIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import {
  EllipsisVerticalIcon,
  HandThumbUpIcon,
  LockClosedIcon,
  PlayIcon,
} from "@heroicons/react/24/solid";

import { useAuth } from "../context/AuthContext";
import { database } from "../firebase";
import { useKaraokeState } from "../hooks/karaoke";
import { useMyPlaylistState } from "../hooks/myPlaylist";
import { getSkeletonItems } from "../utils/api";
import Alert, { AlertHandler } from "./Alert";
import Modal, { ModalHandler } from "./Modal";

// Helper function to get playlists reference
const getPlaylistsRef = () => {
  if (!database) {
    throw new Error('Firebase not configured');
  }
  return collection(database, "playlists");
};

enum MODE {
  CREATE = 1,
  EDIT,
}

export default function ListPlaylistsGrid() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [suggestPlaylists, setSuggestPlaylists] = useState([]);
  const [latestPlaylists, setLatestPlaylists] = useState([]);

  const { setPlaylist } = useKaraokeState();
  const { myPlaylist, setMyPlaylist } = useMyPlaylistState();
  const [mode, setMode] = useState(MODE.CREATE);
  const [selectedItem, setSelectedItem] = useState(null);

  const createModalRef = useRef<ModalHandler>(null);
  const playlistModalRef = useRef<ModalHandler>(null);
  const alertRef = useRef<AlertHandler>(null);

  //for firstime load
  const [isLoadPlaylist, setIsLoadPlaylist] = useState({
    suggest: 0,
    myPlaylist: 0,
  });

  const [data, setData] = useState<any>({
    name: "",
    type: "ส่วนตัว",
  });

  // Fetch data only on first load
  useEffect(() => {
    if (activeIndex === 1 && isLoadPlaylist.myPlaylist == 0) {
      getMyPlaylists();
    } else if (activeIndex === 0 && isLoadPlaylist.suggest == 0) {
      getSuggestPlaylists();
    }
  }, [activeIndex, isLoadPlaylist]);

  // Update playlists when data changes OR when switching tabs
  useEffect(() => {
    // Only update when not currently loading
    if (!isLoading) {
      if (activeIndex === 1) {
        setPlaylists(myPlaylist);
      } else {
        setPlaylists(latestPlaylists);
      }
    }
  }, [activeIndex, myPlaylist, latestPlaylists, isLoading]);

  const getMyPlaylists = async () => {
    if (!database) {
      console.warn('Firebase not configured');
      return [];
    }
    setIsLoading(true);
    try {
      const q = query(getPlaylistsRef(), where("createdBy", "==", user.uid));
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setMyPlaylist(data);

      setIsLoading(false);
      if (isLoadPlaylist.myPlaylist == 0) {
        setIsLoadPlaylist({ ...isLoadPlaylist, myPlaylist: 1 });
      }
      return data;
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  const getSuggestPlaylists = async () => {
    if (!database) {
      console.warn('Firebase not configured');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        getPlaylistsRef(),
        where("type", "==", "public"),
        orderBy("createdAt", "desc"),
        limit(30)
      );
      const querySnapshot = await getDocs(q);
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setLatestPlaylists(data);

      const qSuggest = query(
        getPlaylistsRef(),
        where("type", "==", "public"),
        orderBy("starCount", "desc"),
        limit(24)
      );
      const querySuggestSnapshot = await getDocs(qSuggest);
      const dataSuggest = [];
      querySuggestSnapshot.forEach((doc) => {
        dataSuggest.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setSuggestPlaylists(
        dataSuggest
          // random select playlist
          .map((value) => ({ value, sort: Math.random() }))
          .sort((a, b) => a.sort - b.sort)
          .map(({ value }) => value)
          .slice(0, 12)
      );

      setIsLoading(false);
      if (isLoadPlaylist.suggest == 0) {
        setIsLoadPlaylist({ ...isLoadPlaylist, suggest: 1 });
      }
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  const setVideoPlaylist = async (playlists: any) => {
    try {
      if (playlists.length) {
        setPlaylist(playlists);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deletePlaylist = async (id) => {
    try {
      const docRef = doc(database, "playlists", id);
      await deleteDoc(docRef);
      await getMyPlaylists();
    } catch (error) {
      console.error(error);
    }
  };
  const editPlaylist = async () => {
    const { name, type } = data;
    if (name === "") return;

    try {
      const docRef = doc(database, "playlists", selectedItem?.id);
      await updateDoc(docRef, {
        name,
        type: ["ส่วนตัว", "private"].includes(type) ? "private" : "public",
      });
      await getMyPlaylists();
      createModalRef.current.close();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreatePlaylist = async () => {
    const { name, type } = data;

    if (name === "") return;
    try {
      const playlistDoc = {
        name,
        createdBy: user.uid,
        type: type == "ส่วนตัว" ? "private" : "public",
        starCount: 0,
        createdAt: new Date(),
        playlists: [],
      };

      await addDoc(getPlaylistsRef(), playlistDoc);
      await getMyPlaylists();
      createModalRef.current.close();
    } catch (error: any) {
      console.error(error);
    }
  };

  const openCreateModal = () => {
    setMode(MODE.CREATE);
    createModalRef.current.open();
    setData({ name: "", type: "ส่วนตัว" });
  };

  const openEditModal = (item: any) => {
    const type = item.type === "private" ? "ส่วนตัว" : "สาธารณะ";

    setMode(MODE.EDIT);
    setData({ name: item.name, type });
    setSelectedItem(item);
    createModalRef.current.open();
  };

  const handleDeleteSong = async (id, video) => {
    const docRef = doc(database, "playlists", id);

    await updateDoc(docRef, {
      playlists: arrayRemove(video),
    });
    const data = await getMyPlaylists();
    setSelectedItem(data.find((p) => p.id === id));
  };

  const handleAddLike = async (id) => {
    const docRef = doc(database, "playlists", id);
    await updateDoc(docRef, {
      starCount: increment(1),
    });
    alertRef?.current.open();
  };

  const showNoMyPlaylist = () => {
    if (playlists?.length == 0 && activeIndex === 1)
      return (
        <>
          <div className="col-span-full  bg-transparent pt-4 min-h-screen">
            <div className="text-center place-items-center grid   p-12 rounded-xl  ">
              <RectangleStackIcon className="w-28 h-28 text-gray-500" />

              <h1 className=" text-gray-700 font-semibold text-2xl pb-1">
                ไม่มีเพลย์ลิสต์
              </h1>
              <p className="text-gray-500 font-medium pb-5">
                สร้างเพลย์ลิสต์ใหม่ของคุณเพื่อเอาไว้เล่นสิ!
              </p>
              <button
                type="button"
                className={`btn btn-primary btn-sm`}
                onClick={() => openCreateModal()}
              >
                <PlusIcon className="w-4 h-4" />{" "}
                <span className="pl-1 font-light ">สร้างเพลย์ลิสต์</span>
              </button>
            </div>
          </div>
        </>
      );

    return null;
  };
  const showSuggestPlaylist = () => {
    if (activeIndex === 0)
      return (
        <>
          <div className="col-span-full  bg-transparent p-3 pb-2 pl-2 text-2xl">
            ยอดนิยม
          </div>
          {suggestPlaylists?.map((item, key) => {
            return PlaylistCard(key, item);
          })}
        </>
      );

    return null;
  };

  const PlaylistCard = (key, item) => {
    return (
      <Fragment key={key}>
        <div
          key={"card" + key}
          className="card rounded-lg  bg-white shadow hover:shadow-md flex-auto"
        >
          <figure
            className="relative w-full cursor-pointer aspect-video group"
            onClick={() => {
              setVideoPlaylist(item.playlists);
            }}
          >
            <Image
              unoptimized
              src={
                item?.playlists?.length
                  ? `${process.env.NEXT_PUBLIC_INVIDIOUS_URL}vi/${item.playlists[0]?.videoId}/mqdefault.jpg` // item.playlists[0]["videoThumbnails"][0].url
                  : "/icon-cover.png"
              }
              priority
              alt={item.name}
              layout="fill"
              className="animate-pulse bg-gray-400 "
              onLoad={(ev) =>
                ev.currentTarget.classList.remove("animate-pulse")
              }
              onErrorCapture={(ev) => {
                ev.currentTarget.src = "/icon-cover.png";
              }}
            />
            <div className="absolute top-0 left-0 w-full h-0 flex flex-col justify-center items-center bg-stone-900 opacity-0 group-hover:h-full group-hover:opacity-50 duration-500">
              <PlayIcon className="w-8 h-8 text-white opacity-100" />
            </div>
          </figure>
          <div
            className="card-body p-3 gap-y-0 relative cursor-pointer"
            onClick={() => {
              setSelectedItem(item);
              playlistModalRef?.current.open();
            }}
          >
            <h2 className="font-semibold text-sm 2xl:text-lg line-clamp-2 items-center">
              <span className="flex items-center gap-x-1 ">
                {item.name}{" "}
                {item.type === "private" && (
                  <LockClosedIcon className="w-3 h-3 text-gray-500" />
                )}
              </span>
              <div className="font-light text-xs  text-gray-500 flex flex-row justify-between items-center">
                {item.playlists?.length || 0} รายการ
                <HandThumbUpIcon
                  title="ถูกใจ"
                  className={`w-5 h-5 text-gray-300 hover:text-primary cursor-pointer ${
                    (activeIndex === 1 || !user.uid) && "hidden"
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddLike(item.id);
                  }}
                />
              </div>
            </h2>
            {activeIndex === 1 && (
              <div
                className="dropdown dropdown-end absolute right-2 top-4"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div tabIndex={key} role="button" className="float-right ">
                  <EllipsisVerticalIcon className="w-4 h-4 text-gray-500" />
                </div>
                <ul
                  tabIndex={key}
                  className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-32 text-xs"
                >
                  <li
                    onClick={() => {
                      openEditModal(item);
                    }}
                  >
                    <a>
                      <PencilIcon className="w-4 h-4 text-gray-500" />
                      แก้ไข
                    </a>
                  </li>
                  <li className="text-red-600">
                    <a onClick={() => deletePlaylist(item.id)}>
                      <TrashIcon className="w-4 h-4" />
                      ลบ
                    </a>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </Fragment>
    );
  };

  return (
    <>
      <div className="col-span-full  bg-transparent pt-4">
        <nav className="tabs tabs-boxed flex justify-center  bg-transparent pb-2">
          <button
            type="button"
            className={`tab ${activeIndex === 0 && "tab-active"}`}
            onClick={() => setActiveIndex(0)}
          >
            เพลย์ลิสต์จากสมาชิก
          </button>
          {!!user?.uid && (
            <button
              type="button"
              className={`tab ${activeIndex === 1 && "tab-active"}`}
              onClick={() => setActiveIndex(1)}
            >
              เพลย์ลิสต์ของฉัน
            </button>
          )}
        </nav>
        {activeIndex == 1 && !!playlists.length && (
          <button
            type="button"
            className={`btn btn-primary  btn-sm float-left`}
            onClick={() => openCreateModal()}
          >
            <PlusIcon className="w-4 h-4" />{" "}
            <span className="pl-1 font-light ">สร้างเพลย์ลิสต์</span>
          </button>
        )}
      </div>
      <Modal
        ref={createModalRef}
        title={<>สร้างเพลย์ลิสต์</>}
        body={
          <div className="relative p-6 flex-auto w-96 grid gap-2">
            <input
              id="input-label"
              className="py-3 px-4 block w-full bg-gray-100 rounded-lg text-sm disabled:opacity-50  border-0 disabled:pointer-events-none"
              placeholder="เพลย์ลิสต์ของฉัน"
              required
              onChange={(e: any) => {
                setData({
                  ...data,
                  name: e.target.value,
                });
              }}
              value={data.name}
            />
            <select
              className="py-3 px-4 pe-9 block w-full bg-gray-100 border-transparent rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none "
              onChange={(e: any) => {
                setData({
                  ...data,
                  type: e.target.value,
                });
              }}
              value={data.type}
            >
              <option>ส่วนตัว</option>
              <option>สาธารณะ</option>
            </select>
          </div>
        }
        footer={
          <button
            className="text-white btn-primary font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
            type="submit"
            onClick={() =>
              mode === MODE.CREATE ? handleCreatePlaylist() : editPlaylist()
            }
          >
            {mode === MODE.CREATE ? "สร้าง" : "บันทึก"}
          </button>
        }
      />

      <Modal
        ref={playlistModalRef}
        title={<span className="text-clip">รายการ</span>}
        body={
          <div className="relative px-6 w-full">
            <div className="overflow-y-auto max-h-64">
              <div className="pb-4 text-gray-900">เพลย์ลิสต์: {selectedItem?.name}</div>

              {selectedItem?.playlists?.length === 0 && (
                <div className="p-5 w-96"></div>
              )}

              {/* Text-only song cards - 3 columns on mobile, 4 on larger screens */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-5 gap-2">
                {selectedItem?.playlists?.map((video, index) => (
                  <div
                    key={video.videoId + index}
                    className="relative bg-base-200/50 hover:bg-base-200 rounded-lg border border-base-300 hover:border-primary transition-all group"
                  >
                    {/* Song title only */}
                    <div className="p-3 min-h-[80px] flex items-center justify-center">
                      <h2 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-3 text-center">
                        {video?.title}
                      </h2>
                    </div>

                    {/* Delete button - show only for owned playlists */}
                    {activeIndex === 1 && (
                      <button
                        className="absolute top-1 right-1 w-6 h-6 rounded-lg bg-error/10 hover:bg-error/20 flex items-center justify-center transition-colors"
                        onClick={() =>
                          handleDeleteSong(selectedItem.id, video)
                        }
                        title="ลบเพลง"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-error">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        }
        footer={
          <button
            className="text-white btn-primary font-bold uppercase text-sm px-6 py-3 rounded shadow hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 ease-linear transition-all duration-150"
            type="submit"
            onClick={() => {
              setVideoPlaylist(selectedItem.playlists);
              playlistModalRef?.current.close();
            }}
          >
            เล่น
          </button>
        }
      />
      <Alert
        ref={alertRef}
        timer={2500}
        headline="สำเร็จ"
        headlineColor="text-green-600"
        bgColor="bg-green-100"
        content={<span className="text-sm">ถูกใจสำเร็จ</span>}
        icon={<HandThumbUpIcon />}
      />
      <div
        className={`relative grid grid-cols-2 xl:grid-cols-3  pt-2 gap-2 col-span-full`}
      >
        {isLoading && (
          <>
            <div className="absolute inset-0 bg-gradient-to-t from-base-300 z-10" />
            {getSkeletonItems(16).map((s) => (
              <div
                key={s}
                className="card bg-gray-300 animate-pulse w-full aspect-w-4 aspect-h-3"
              />
            ))}
          </>
        )}

        {showSuggestPlaylist()}
        {showNoMyPlaylist()}
        {activeIndex === 0 && (
          <div className="col-span-full  bg-transparent p-3 pb-2 pl-2 text-2xl">
            ล่าสุด
          </div>
        )}
        {playlists?.map((item, key) => {
          return PlaylistCard(key, item);
        })}
      </div>
    </>
  );
}
