import styles from '../../styles/Home.module.css'
import {ListDemo} from "../ui/ListDemo";
import {useRouter} from "next/router";

export default function Home() {
  const router = useRouter();
  return (
    <div>
        <div className="max-w-3xl my-0 mx-auto p-5">
            <ListDemo onClick={() => router.push('/list')}/>
        </div>
    </div>
  )
}
