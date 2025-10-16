import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import SwipeableDrawer from "@mui/material/SwipeableDrawer";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { ReactNode } from "react";
import { useId } from "react";

export type QuickActionsTab = "chapters" | "context";

export type QuickActionsDrawerProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  activeTab: QuickActionsTab;
  onChangeTab: (tab: QuickActionsTab) => void;
  chaptersContent: ReactNode;
  contextContent: ReactNode;
};

const tabToIndex: Record<QuickActionsTab, number> = {
  chapters: 0,
  context: 1,
};

const indexToTab: Record<number, QuickActionsTab> = {
  0: "chapters",
  1: "context",
};

type TabPanelProps = {
  value: QuickActionsTab;
  tab: QuickActionsTab;
  ariaLabelledBy: string;
  children: ReactNode;
};

function TabPanel({ value, tab, ariaLabelledBy, children }: TabPanelProps) {
  const hidden = value !== tab;
  return (
    <Box
      role="tabpanel"
      id={`${ariaLabelledBy}-panel`}
      aria-labelledby={ariaLabelledBy}
      hidden={hidden}
      sx={{
        flex: 1,
        overflowY: "auto",
        display: hidden ? "none" : "block",
        pt: 2,
      }}
    >
      {hidden ? null : children}
    </Box>
  );
}

export function QuickActionsDrawer({
  open,
  onOpen,
  onClose,
  activeTab,
  onChangeTab,
  chaptersContent,
  contextContent,
}: QuickActionsDrawerProps) {
  const baseId = useId();
  const chaptersTabId = `${baseId}-quick-actions-tab-chapters`;
  const contextTabId = `${baseId}-quick-actions-tab-context`;

  return (
    <SwipeableDrawer
      anchor="top"
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      swipeAreaWidth={56}
      slotProps={{
        paper: {
          id: "quick-actions-drawer",
          sx: {
            height: "70vh",
            maxHeight: "100%",
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
            overflow: "hidden",
            backdropFilter: "blur(18px)",
          },
        },
      }}
      ModalProps={{
        keepMounted: true,
        sx: {
          display: "flex",
          alignItems: "flex-start",
          mt: { xs: 0, sm: 2 },
        },
      }}
      sx={{
        "& .MuiDrawer-root": {
          pointerEvents: "auto",
        },
      }}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          height: "100%",
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        })}
      >
        <Box
          sx={(theme) => ({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: theme.spacing(3),
            pt: theme.spacing(2.5),
            pb: theme.spacing(1.5),
          })}
        >
          <Typography variant="subtitle1" fontWeight={600} component="h2">
            Acciones rápidas
          </Typography>
          <IconButton
            aria-label="Cerrar acciones rápidas"
            onClick={onClose}
            edge="end"
            size="small"
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Divider />
        <Tabs
          value={tabToIndex[activeTab]}
          onChange={(_, nextIndex: number) => {
            const nextTab = indexToTab[nextIndex];
            if (nextTab) {
              onChangeTab(nextTab);
            }
          }}
          aria-label="Cambiar sección de acciones rápidas"
          variant="fullWidth"
        >
          <Tab
            disableRipple
            label="Capítulos"
            id={chaptersTabId}
            aria-controls={`${chaptersTabId}-panel`}
          />
          <Tab
            disableRipple
            label="Contexto"
            id={contextTabId}
            aria-controls={`${contextTabId}-panel`}
          />
        </Tabs>
        <Divider />
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", px: 3, pb: 3 }}>
          <TabPanel value={activeTab} tab="chapters" ariaLabelledBy={chaptersTabId}>
            {chaptersContent}
          </TabPanel>
          <TabPanel value={activeTab} tab="context" ariaLabelledBy={contextTabId}>
            {contextContent}
          </TabPanel>
        </Box>
      </Box>
    </SwipeableDrawer>
  );
}

