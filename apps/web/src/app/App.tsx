import { RouterProvider, type createBrowserRouter } from 'react-router';
import { RepositoryProvider } from '../data/RepositoryContext';
import type { MedFocoRepository } from '../data/repository';
import { FocoProvider } from '../features/foco/FocoContext';

type AppRouter = ReturnType<typeof createBrowserRouter>;

export function App({ router, repository }: { router: AppRouter; repository: MedFocoRepository }) {
  return (
    <RepositoryProvider repository={repository}>
      <FocoProvider>
        <RouterProvider router={router} />
      </FocoProvider>
    </RepositoryProvider>
  );
}
