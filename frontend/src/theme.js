import { createTheme, responsiveFontSizes } from "@mui/material/styles";

export const getTheme = (mode) =>
  responsiveFontSizes(createTheme({
    palette: {
      mode,

      primary: {
        main: "#38bdf8",
        light: "#7dd3fc",
        dark: "#0284c7",
      },

      secondary: {
        main: "#a855f7",
        light: "#c084fc",
        dark: "#7e22ce",
      },

      background: {
        default: mode === "light" ? "#f8fafc" : "#070913",
        paper: mode === "light" ? "#ffffff" : "rgba(17, 24, 39, 0.75)",
      },

      text: {
        primary: mode === "light" ? "#0f172a" : "#f8fafc",
        secondary: mode === "light" ? "#64748b" : "#94a3b8",
      },

      divider: mode === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.12)",
    },

    shape: {
      borderRadius: 14,
    },

    typography: {
      fontFamily: "'Inter', system-ui, -apple-system, Roboto, sans-serif",
      h3: {
        fontWeight: 800,
        letterSpacing: "-0.8px",
      },
      h4: {
        fontWeight: 800,
        letterSpacing: "-0.6px",
      },
      h5: {
        fontWeight: 700,
        letterSpacing: "-0.4px",
      },
      h6: {
        fontWeight: 700,
        letterSpacing: "-0.2px",
      },
    },

    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: "none",
            backgroundColor: mode === "light" ? "#ffffff" : "rgba(17, 24, 39, 0.7)",
            backdropFilter: "blur(16px)",
            border: mode === "light" ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              mode === "light"
                ? "0 4px 20px rgba(0,0,0,0.04)"
                : "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            backgroundColor: mode === "light" ? "#ffffff" : "rgba(17, 24, 39, 0.7)",
            backdropFilter: "blur(16px)",
            border: mode === "light" ? "1px solid rgba(0,0,0,0.08)" : "1px solid rgba(255,255,255,0.12)",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === "light" ? "#ffffff" : "#111827",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: mode === "light" ? "#ffffff" : "#111827",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            borderRadius: 10,
            fontWeight: 600,
          },
        },
      },
    },
  }));
