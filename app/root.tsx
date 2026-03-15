import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import {
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";

import type { Route } from "@/+types/root";
import "@/app.css";

const theme = createTheme({
  palette: {
    mode: "light",
  },
  typography: {
    fontFamily: '"Inter", "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
  },
});

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  { rel: "icon", href: `${import.meta.env.BASE_URL}favicon.ico`, type: "image/x-icon" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
          <ScrollRestoration />
          <Scripts />
        </ThemeProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "エラーが発生しました";
  let details = "予期しないエラーが発生しました。";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : `${error.status} エラー`;
    details = getErrorResponseMessage(error.status, error.statusText);
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message || "開発中にエラーが発生しました。";
    stack = error.stack;
  }

  return (
    <Container maxWidth="md" sx={{ pt: 8, px: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {message}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {details}
      </Typography>
      {stack && (
        <Box
          component="pre"
          sx={{
            width: "100%",
            p: 2,
            mt: 2,
            overflowX: "auto",
            bgcolor: "grey.100",
            borderRadius: 1,
          }}
        >
          <code>{stack}</code>
        </Box>
      )}
    </Container>
  );
}

function getErrorResponseMessage(status: number, statusText?: string) {
  switch (status) {
    case 400:
      return "リクエストが正しくありません。";
    case 401:
      return "認証が必要です。";
    case 403:
      return "このページにアクセスする権限がありません。";
    case 404:
      return "お探しのページは見つかりませんでした。";
    case 405:
      return "許可されていない操作です。";
    case 500:
      return "サーバー内部でエラーが発生しました。";
    case 503:
      return "サービスは現在利用できません。";
    default:
      return statusText ? `リクエストの処理に失敗しました: ${statusText}` : "リクエストの処理中にエラーが発生しました。";
  }
}
