import { resetServerContext } from 'react-beautiful-dnd';
import TodoListsView from 'src/ui/view/TodoListsView';

export default function Home() {
  return <TodoListsView />;
}

export const getServerSideProps = () => {
  resetServerContext();
  return {
    props: {},
  };
};
