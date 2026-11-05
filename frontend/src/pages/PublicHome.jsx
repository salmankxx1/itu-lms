import { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Paper,
  Slider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CalculateIcon from "@mui/icons-material/Calculate";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EmailIcon from "@mui/icons-material/Email";
import { Link } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";

import { ITU_PROGRAMS, BURKI_CAMPUS_DETAILS, ITU_FACULTY } from "../services/ituData";

const RATE_PER_CREDIT_HOUR = 11500;

const SECTIONS = [
  ["#programs", "Programs & Fees"],
  ["#burki-campus", "Burki Road Campus"],
  ["#faculty", "Faculty"],
];

export default function PublicHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("All");

  // Tuition Calculator State
  const [calcCreditHours, setCalcCreditHours] = useState(16);
  const [includeHostel, setIncludeHostel] = useState(false);

  const filteredPrograms = ITU_PROGRAMS.filter((prog) => {
    const matchesSearch =
      prog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prog.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel =
      selectedLevel === "All" || prog.degreeLevel.startsWith(selectedLevel);
    return matchesSearch && matchesLevel;
  });

  const estimatedTuition = calcCreditHours * RATE_PER_CREDIT_HOUR;
  const labTechFee = 15000;
  const hostelFee = includeHostel ? 45000 : 0;
  const totalSemesterEstimated = estimatedTuition + labTechFee + hostelFee;

  return (
    <Box sx={{ bgcolor: "#0b0f19", color: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Banner & Header */}
      <Box
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          bgcolor: "rgba(11, 15, 25, 0.95)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          px: { xs: 2, md: 6 },
          py: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component="img"
              src="https://itu.edu.pk/wp-content/uploads/2024/05/Logo-ITU-NEW-300x160.png"
              alt="ITU Logo"
              sx={{ height: 42, objectFit: "contain" }}
            />
            <Box sx={{ display: { xs: "none", sm: "block" } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", lineHeight: 1.1, color: "#fff" }}>
                Information Technology University
              </Typography>
              <Typography variant="caption" sx={{ color: "#38bdf8", letterSpacing: 0.8, fontWeight: "bold" }}>
                BURKI ROAD CAMPUS, LAHORE
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, md: 2 } }}>
            {SECTIONS.map(([href, label]) => (
              <Button
                key={href}
                component="a"
                href={href}
                sx={{ color: "#cbd5e1", textTransform: "none", display: { xs: "none", md: "inline-flex" } }}
              >
                {label}
              </Button>
            ))}
            <Button
              component={Link}
              to="/login"
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                textTransform: "none",
                fontWeight: "bold",
                px: { xs: 1.5, sm: 3 },
                whiteSpace: "nowrap",
                borderRadius: "8px",
                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.4)",
                "&:hover": {
                  background: "linear-gradient(135deg, #0369a1 0%, #075985 100%)",
                },
              }}
            >
              Portal Login
            </Button>
            <IconButton
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
              sx={{ color: "#fff", display: { xs: "inline-flex", md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <Drawer anchor="right" open={menuOpen} onClose={() => setMenuOpen(false)}>
        <List sx={{ width: 240 }}>
          {SECTIONS.map(([href, label]) => (
            <ListItemButton key={href} component="a" href={href} onClick={() => setMenuOpen(false)}>
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Hero Section with Official Campus Background Photo */}
      <Box
        sx={{
          position: "relative",
          minHeight: "560px",
          display: "flex",
          alignItems: "center",
          backgroundImage: `linear-gradient(to right, rgba(11, 15, 25, 0.95) 30%, rgba(11, 15, 25, 0.75) 70%, rgba(11, 15, 25, 0.85) 100%), url('/images/campus-wide.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="xl">
          <Grid container spacing={4} sx={{ alignItems: "center" }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Chip
                label="ITU Purpose-Built Campus • Burki Road, Lahore"
                sx={{
                  bgcolor: "rgba(56, 189, 248, 0.15)",
                  color: "#38bdf8",
                  border: "1px solid rgba(56, 189, 248, 0.4)",
                  fontWeight: "bold",
                  mb: 2.5,
                  backdropFilter: "blur(8px)",
                }}
              />
              <Typography
                variant="h2"
               
                sx={{ fontWeight: "900",
                  fontSize: { xs: "2.3rem", md: "3.6rem" },
                  lineHeight: 1.15,
                  mb: 2.5,
                  color: "#fff",
                }}
              >
                Pioneering <span style={{ color: "#38bdf8" }}>Technology</span> & Research in Pakistan
              </Typography>
              <Typography variant="body1" sx={{ color: "#cbd5e1", fontSize: "1.15rem", mb: 4, lineHeight: 1.7, maxWidth: "620px" }}>
                Information Technology University (ITU) offers world-class computing, engineering, and artificial intelligence degrees. 
                Explore our accredited programs, transparent semester fees, and our state-of-the-art 183-kanal Burki Road campus.
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  component="a"
                  href="#programs"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    bgcolor: "#0284c7",
                    px: 3.5,
                    py: 1.4,
                    fontWeight: "bold",
                    borderRadius: "10px",
                    "&:hover": { bgcolor: "#0369a1" },
                  }}
                >
                  Explore Programs & Fees
                </Button>
                <Button
                  component="a"
                  href="#calculator"
                  variant="outlined"
                  size="large"
                  startIcon={<CalculateIcon />}
                  sx={{
                    borderColor: "rgba(255,255,255,0.3)",
                    color: "#f8fafc",
                    px: 3,
                    borderRadius: "10px",
                    backdropFilter: "blur(6px)",
                    "&:hover": { borderColor: "#38bdf8", bgcolor: "rgba(56, 189, 248, 0.1)" },
                  }}
                >
                  Tuition Calculator
                </Button>
              </Box>

              {/* Quick Stats */}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: { xs: 2.5, sm: 4 }, mt: 5, pt: 3, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
                    100%
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                    PhD Faculty
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
                    183+
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                    Kanals Burki Campus
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
                    #1
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                    Tech University in Punjab
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Campus Photo Card */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Box
                sx={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                  bgcolor: "rgba(15, 23, 42, 0.7)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Box
                  component="img"
                  src={BURKI_CAMPUS_DETAILS[0].heroBanner}
                  alt="Architect's rendering of the ITU Burki Road campus"
                  sx={{ width: "100%", height: { xs: 200, md: 260 }, objectFit: "cover", display: "block" }}
                />
                <Box sx={{ p: 2.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
                    ITU Purpose-Built Main Campus
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8", mt: 0.5 }}>
                    Architect's rendering of the campus on Main Burki Road, Lahore.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Program Finder & Fee Catalog */}
      <Box id="programs" sx={{ py: 8, bgcolor: "#0f172a" }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Chip label="Transparent Tuition & Academics" sx={{ bgcolor: "rgba(2, 132, 199, 0.15)", color: "#38bdf8", mb: 1.5 }} />
            <Typography variant="h3" sx={{ fontWeight: "bold", color: "#fff", mb: 1 }}>
              Academic Programs & Fee Catalog
            </Typography>
            <Typography variant="body1" sx={{ color: "#94a3b8", maxWidth: "650px", mx: "auto" }}>
              Explore degree pathways, credit hours, and detailed tuition rates without needing an account.
            </Typography>
          </Box>

          {/* Search and Filters */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 2,
              mb: 4,
              p: 2,
              bgcolor: "rgba(30, 41, 59, 0.5)",
              borderRadius: "14px",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <TextField
              placeholder="Search by degree name, code, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                width: { xs: "100%", md: "400px" },
                "& .MuiOutlinedInput-root": {
                  color: "#fff",
                  bgcolor: "rgba(15, 23, 42, 0.8)",
                  borderRadius: "10px",
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#94a3b8" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              {["All", "Undergraduate", "Graduate"].map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "contained" : "outlined"}
                  onClick={() => setSelectedLevel(level)}
                  sx={{
                    borderRadius: "8px",
                    textTransform: "none",
                    borderColor: "rgba(255,255,255,0.15)",
                    color: selectedLevel === level ? "#fff" : "#cbd5e1",
                    bgcolor: selectedLevel === level ? "#0284c7" : "transparent",
                    "&:hover": { bgcolor: selectedLevel === level ? "#0369a1" : "rgba(255,255,255,0.05)" },
                  }}
                >
                  {level}
                </Button>
              ))}
            </Box>
          </Box>

          {/* Program Cards Grid */}
          <Grid container spacing={3}>
            {filteredPrograms.map((prog) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={prog.id}>
                <Card
                  sx={{
                    height: "100%",
                    bgcolor: "#1e293b",
                    color: "#f8fafc",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, border-color 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: "#0284c7",
                      boxShadow: "0 10px 30px rgba(2, 132, 199, 0.2)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, flexGrow: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                      <Chip
                        label={prog.code}
                        size="small"
                        sx={{ bgcolor: "#0284c7", color: "#fff", fontWeight: "bold" }}
                      />
                      <Typography variant="caption" sx={{ color: "#38bdf8", fontWeight: "bold" }}>
                        {prog.degreeLevel}
                      </Typography>
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: "bold", color: "#fff", mb: 0.5 }}>
                      {prog.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
                      {prog.department}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 3, lineHeight: 1.6 }}>
                      {prog.description}
                    </Typography>

                    {/* Fee Details Box */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "10px",
                        bgcolor: "rgba(15, 23, 42, 0.6)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        mb: 2,
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                          Semester Tuition:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "#38bdf8" }}>
                          PKR {prog.tuitionPerSemester.toLocaleString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                          Total Credits:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: "bold", color: "#f8fafc" }}>
                          {prog.creditHours} Cr. Hrs
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                          Admission Fee (One-time):
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#cbd5e1" }}>
                          PKR {prog.admissionFee.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                      {prog.highlights.map((h, idx) => (
                        <Chip
                          key={idx}
                          label={h}
                          size="small"
                          sx={{
                            bgcolor: "rgba(56, 189, 248, 0.08)",
                            color: "#94a3b8",
                            border: "1px solid rgba(56, 189, 248, 0.2)",
                            fontSize: "11px",
                          }}
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Interactive Tuition Fee Estimator Section */}
      <Box id="calculator" sx={{ py: 8, bgcolor: "#0b0f19" }}>
        <Container maxWidth="lg">
          <Paper
            sx={{
              p: { xs: 3, md: 5 },
              bgcolor: "rgba(30, 41, 59, 0.7)",
              borderRadius: "20px",
              border: "1px solid rgba(56, 189, 248, 0.3)",
              backdropFilter: "blur(10px)",
              color: "#fff",
            }}
          >
            <Grid container spacing={4} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
                  <CalculateIcon sx={{ color: "#38bdf8", fontSize: "2rem" }} />
                  <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                    Interactive Tuition Calculator
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ color: "#94a3b8", mb: 4 }}>
                  Simulate your estimated per-semester fee based on enrolled credit hours and campus residence.
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ color: "#cbd5e1", mb: 1 }}>
                    Credit Hours Enrolled: <strong>{calcCreditHours} Cr. Hrs</strong>
                  </Typography>
                  <Slider
                    value={calcCreditHours}
                    min={9}
                    max={21}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    onChange={(e, val) => setCalcCreditHours(val)}
                    sx={{ color: "#0284c7" }}
                  />
                </Box>

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                  <Button
                    variant={includeHostel ? "contained" : "outlined"}
                    onClick={() => setIncludeHostel(!includeHostel)}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      bgcolor: includeHostel ? "#0284c7" : "transparent",
                      color: "#fff",
                      borderColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    {includeHostel ? "✓ Hostel Accommodations Added (PKR 45,000)" : "+ Add Hostel Accommodations"}
                  </Button>
                </Box>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Box
                  sx={{
                    bgcolor: "rgba(15, 23, 42, 0.9)",
                    p: { xs: 2.5, sm: 4 },
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="overline" sx={{ color: "#94a3b8", letterSpacing: 1.2 }}>
                    Estimated Semester Total
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: "900", color: "#38bdf8", my: 1.5 }}>
                    PKR {totalSemesterEstimated.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 2 }}>
                    Includes tuition, laboratory charges, and IT resource licensing.
                  </Typography>
                  <Button
                    component={Link}
                    to="/login"
                    fullWidth
                    variant="contained"
                    sx={{
                      bgcolor: "#0284c7",
                      fontWeight: "bold",
                      py: 1.2,
                      borderRadius: "8px",
                      "&:hover": { bgcolor: "#0369a1" },
                    }}
                  >
                    Sign In to Portal
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>

      {/* Burki Road Campus Showcase with Actual Facilities Photos */}
      <Box id="burki-campus" sx={{ py: 8, bgcolor: "#0f172a" }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 6, textAlign: "center" }}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, mb: 1 }}>
              <LocationOnIcon sx={{ color: "#38bdf8" }} />
              <Typography variant="overline" sx={{ color: "#38bdf8", fontWeight: "bold", letterSpacing: 1.5 }}>
                BURKI ROAD, LAHORE
              </Typography>
            </Box>
            <Typography variant="h3" sx={{ fontWeight: "bold", color: "#fff", mb: 1.5 }}>
              The Purpose-Built Burki Road Campus
            </Typography>
            <Typography variant="body1" sx={{ color: "#94a3b8", maxWidth: "750px", mx: "auto" }}>
              Spanning over 183 kanals along Burki Road, our brand-new campus integrates sustainable architecture, 
              cutting-edge supercomputing clusters, collaborative maker-spaces, and lush open sports complexes.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {BURKI_CAMPUS_DETAILS[0].facilities.map((fac, idx) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
                <Card
                  sx={{
                    bgcolor: "#1e293b",
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <CardMedia component="img" height="190" image={fac.img} alt={fac.name} />
                  <CardContent sx={{ p: 2.5, flexGrow: 1 }}>
                    <Chip
                      label={fac.tag}
                      size="small"
                      sx={{ bgcolor: "rgba(2, 132, 199, 0.2)", color: "#38bdf8", mb: 1, fontWeight: "bold" }}
                    />
                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff", mb: 1, fontSize: "1.05rem" }}>
                      {fac.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.88rem" }}>
                      {fac.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Official Faculty Showcase with Real ITU Headshots */}
      <Box id="faculty" sx={{ py: 8, bgcolor: "#0b0f19" }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: "center", mb: 6 }}>
            <Chip label="World-Renowned Researchers" sx={{ bgcolor: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", mb: 1.5 }} />
            <Typography variant="h3" sx={{ fontWeight: "bold", color: "#fff", mb: 1 }}>
              Meet Our Esteemed Faculty
            </Typography>
            <Typography variant="body1" sx={{ color: "#94a3b8" }}>
              Official ITU leadership and department chairs — educated at Cambridge, Georgia Tech, Sapienza, LUMS, and Manchester.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {ITU_FACULTY.map((prof) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={prof.id}>
                <Card
                  sx={{
                    bgcolor: "#1e293b",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    p: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    transition: "transform 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      borderColor: "#0284c7",
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={prof.avatar}
                    alt={prof.name}
                    sx={{
                      width: 110,
                      height: 110,
                      borderRadius: "50%",
                      objectFit: "cover",
                      mb: 2,
                      border: "3px solid #0284c7",
                      boxShadow: "0 4px 15px rgba(2, 132, 199, 0.3)",
                    }}
                  />
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "#fff", mb: 0.5 }}>
                    {prof.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#38bdf8", display: "block", mb: 1, fontWeight: "bold" }}>
                    {prof.role}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "0.85rem", mb: 1 }}>
                    {prof.dept}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "#cbd5e1", mb: 2, fontStyle: "italic" }}>
                    {prof.education}
                  </Typography>
                  <Chip
                    label={prof.research}
                    size="small"
                    sx={{ bgcolor: "rgba(255,255,255,0.05)", color: "#cbd5e1", fontSize: "11px", mb: 1.5 }}
                  />
                  <Box sx={{ mt: "auto", display: "flex", alignItems: "center", gap: 0.8, color: "#38bdf8", fontSize: "12px" }}>
                    <EmailIcon sx={{ fontSize: 16 }} />
                    <span>{prof.email}</span>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 4, bgcolor: "#050811", borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: "#64748b" }}>
          © {new Date().getFullYear()} Information Technology University (ITU) of the Punjab, Main Burki Road Campus, Lahore. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
