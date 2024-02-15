import type {
  JSXElementConstructor,
  PropsWithChildren,
  ReactNode,
} from 'react';

type Props = {
  components: Array<JSXElementConstructor<PropsWithChildren<unknown>>>;
  children: ReactNode;
};

export default function ProviderCompose(props: Props) {
  const { components = [], children } = props;

  return (
    <>
      {components.reduceRight((acc, Comp) => {
        return <Comp>{acc}</Comp>;
      }, children)}
    </>
  );
}
