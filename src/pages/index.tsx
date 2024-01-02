import TodoListsView from 'src/ui/view/TodoListsView';
import {resetServerContext} from "react-beautiful-dnd";

export default function Home() {
    return <TodoListsView/>;
}

export const getServerSideProps = () => {
    resetServerContext();
    return {
        props: {}
    };
}