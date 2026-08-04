async function search() {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent('ทะเลใจ')}`);
    const data = await res.json();
    console.log(JSON.stringify(data[0], null, 2));
}
search();
