with open("src/stores/useAIVocalStore.ts", "r") as f:
    content = f.read()

old_code = '''
        const currentJob = jobs[videoId];
'''

new_code = '''
        if (!useManualUpload && (!rapidapiKey || rapidapiKey.trim() === "")) {
            if (typeof window !== "undefined") {
                alert("กรุณากรอก API Key ของ RapidAPI ในเมนูตั้งค่า (แท็บ AI) ก่อนเริ่มแยกเสียงจาก YouTube ครับ เพื่อให้การดาวน์โหลดมีความเสถียรที่สุด");
            }
            return;
        }

        const currentJob = jobs[videoId];
'''

content = content.replace(old_code, new_code)
with open("src/stores/useAIVocalStore.ts", "w") as f:
    f.write(content)
print("Frontend store patched")
