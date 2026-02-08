
const { Innertube, UniversalCache } = require('youtubei.js');

(async () => {
    try {
        console.log('Initializing Innertube...');
        const yt = await Innertube.create({
            cache: new UniversalCache(false),
            generate_session_locally: true
        });

        console.log('Fetching Music Home Feed...');
        const home = await yt.music.getHomeFeed();

        console.log('Success!');
        console.log('Sections found:', home.sections?.length);

        if (home.sections?.length > 0) {
            console.log('First Section Title:', home.sections[0].title?.text);
        } else {
            console.log('No sections found (Possible parsing issue or empty feed)');
        }

    } catch (error) {
        console.error('FAILED:', error);
    }
})();
