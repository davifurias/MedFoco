import { RouterProvider, type createBrowserRouter } from 'react-router';
import { RepositoryProvider } from '../data/RepositoryContext';
import type { MedFocoRepository } from '../data/repository';

type AppRouter = ReturnType<typeof createBrowserRouter>;

export function App({ router, repository }: { router: AppRouter; repository: MedFocoRepository }) {
  return (
    <RepositoryProvider repository={repository}>
      <RouterProvider router={router} />
    </RepositoryProvider>
  );
}
