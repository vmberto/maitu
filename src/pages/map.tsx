import dynamic from "next/dynamic";
import {useMemo} from "react";

export default function MyPage() {
    const Map = useMemo(() => dynamic(
        () => import('src/ui/view/Map'),
        {
            loading: () => <p>A map is loading</p>,
            ssr: false
        }
    ), [])

    return <Map/>
}