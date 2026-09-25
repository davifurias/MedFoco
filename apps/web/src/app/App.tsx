import { RouterProvider, type createBrowserRouter } from 'react-router';

type AppRouter = ReturnType<typeof createBrowserRouter>;

export function App({ router }: { router: AppRouter }) {
  return <RouterProvider router={router} />;
}
