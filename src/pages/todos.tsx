import { resetServerContext } from 'react-beautiful-dnd';
import TodosView from 'src/ui/view/TodosView';

export default function Todos() {
  return <TodosView />;
}

export const getServerSideProps = () => {
  resetServerContext();
  return {
    props: {},
  };
};
