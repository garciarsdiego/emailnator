import { AppProviders } from "@/app/providers/AppProviders";
import { AppRouter } from "@/app/router/AppRouter";
import { ErrorBoundary } from "@/app/ErrorBoundary";
import { SkipLink } from "@/components/v2/SkipLink";

const App = () => (
  <ErrorBoundary>
    <AppProviders>
      <SkipLink />
      <AppRouter />
    </AppProviders>
  </ErrorBoundary>
);

export default App;
