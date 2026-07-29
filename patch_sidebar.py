with open("src/components/navigation/Sidebar.tsx", "r") as f:
    content = f.read()

# I want to insert the Local Library link after the playlists button.
playlist_btn = """                <button onClick={() => handleNav(4, 'playlists')} 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/' && activeIndex === 4) ? "bg-primary text-white translate-x-1" : "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? "เพลย์ลิสต์" : ""}
                >
                    <Library className={clsx("w-[22px] h-[22px]", (router.pathname === '/' && activeIndex === 4) ? "text-white" : "text-black dark:text-zinc-400")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        เพลย์ลิสต์
                    </span>
                </button>"""

local_library_btn = """
                <Link href="/library" 
                    className={clsx(
                        "w-full flex items-center transition-all font-bold duration-300 text-sm mt-2",
                        isSidebarCollapsed ? "justify-center p-3 rounded-xl" : "gap-3 px-4 py-3 rounded-2xl",
                        (router.pathname === '/library') ? "bg-primary text-white translate-x-1" : "text-black dark:text-zinc-400 hover:bg-gray-100/50 dark:hover:bg-zinc-900/50 hover:text-black dark:hover:text-white"
                    )}
                    title={isSidebarCollapsed ? "คลังส่วนตัว" : ""}
                >
                    <Sparkles className={clsx("w-[22px] h-[22px]", (router.pathname === '/library') ? "text-white" : "text-black dark:text-zinc-400")} /> 
                    <span className={clsx("transition-all duration-300 whitespace-nowrap", isSidebarCollapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100")}>
                        คลังส่วนตัว
                    </span>
                </Link>"""

if playlist_btn in content:
    content = content.replace(playlist_btn, playlist_btn + "\n" + local_library_btn)
    with open("src/components/navigation/Sidebar.tsx", "w") as f:
        f.write(content)
    print("Patched Sidebar.tsx")
else:
    print("Could not find playlist button to patch")
