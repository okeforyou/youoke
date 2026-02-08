import Head from 'next/head';
import RemoteControlApp from '../modules/remote-control/components/RemoteControlApp';

export default function RemotePage() {
    return (
        <>
            <Head>
                <title>YouOke Remote</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
            </Head>
            <RemoteControlApp />
        </>
    );
}
