import { useState } from "react";
import { IconButton, InputAdornment, TextField, Tooltip } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

// A password input with an eye button that shows or hides what was typed
function PasswordField({ iconColor, ...props }) {
  const [visible, setVisible] = useState(false);

  const label = visible ? "Hide password" : "Show password";

  return (
    <TextField
      {...props}
      type={visible ? "text" : "password"}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={label}>
                <IconButton
                  aria-label={label}
                  edge="end"
                  onClick={() => setVisible((current) => !current)}
                  onMouseDown={(e) => e.preventDefault()}
                  sx={{ color: iconColor }}
                >
                  {visible ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </Tooltip>
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export default PasswordField;
