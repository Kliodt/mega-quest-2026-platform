s = [
[ "tdwup", "6️⃣"],
[ "uprzq", "😡"],
[ "ioufr", "🖥"],
[ "iputx", "😇"],
[ "dmmjv", "👑"],
[ "zbtzg", "😎"],
[ "kzxvv", "🛹"],
[ "jyreh", "😭"],
[ "wbavc", "🙃"],
[ "lxxux", "🤡"],
[ "pmxvp", "🤳"],
[ "gwapu", "❤️"],
[ "pyait", "🤨"],
[ "snedw", "🥚"],
[ "aobjk", "🔉"],
[ "emudu", "💤"],
[ "hhkmm", "🚘"],
[ "jwuaj", "😉"],
[ "hsdqo", "😊"],
[ "szmis", "🤍"],
[ "wilrs", "🙂"],
[ "gpzlt", "🏆"],
[ "lrdqb", "🫡"],
[ "khiyy", "🔥"],
]

for i in s:
    with open(f"packages/web/public/achievements/{i[0]}.png", "wb") as f:
        with open(f"packages/web/public/achievements/{i[1]}", "rb") as f2:
            f.write(f2.read())
