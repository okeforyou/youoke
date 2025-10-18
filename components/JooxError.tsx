import React from "react";

import { WrenchIcon } from "@heroicons/react/24/solid";

const JooxError = () => {
  return (
    <div className="col-span-full pt-32  ">
      <div className="text-center place-items-center grid   p-12 rounded-xl  ">
        <WrenchIcon className="w-28 h-28 text-gray-500" />
        <h1 className=" text-gray-700 font-semibold text-2xl pt-4 pb-1">
          ขออภัย ไม่พบข้อมูล กรุณาลองใหม่
        </h1>
        {/* <p className="text-gray-500 font-medium pb-5">
          จึงไม่สามารถแสดงรายชื่อศิลปินได้ แต่ค้นหาเพลงและเล่นเพลงได้ปกติ!
        </p> */}
      </div>
    </div>
  );
};
export default JooxError;
