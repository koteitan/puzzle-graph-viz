local wezterm = require 'wezterm'
local act = require "wezterm".action

local config = {}

if wezterm.config_builder then
  config = wezterm.config_builder()
end

config.default_domain = 'WSL:Ubuntu'
config.color_scheme = 'Aco (Gogh)'
config.font_size = 10
config.initial_rows = 10
config.initial_cols = 80

config.window_decorations = "RESIZE"
--config.hide_tab_bar_if_only_one_tab = true
config.use_ime = true
config.window_close_confirmation = 'AlwaysPrompt'
config.enable_scroll_bar = true
config.default_cursor_style = 'BlinkingUnderline'
font = wezterm.font("Consolas", {weight="Regular", stretch="Normal", style="Normal"})
config.audible_bell = 'Disabled'

config.leader = { key="b", mods="CTRL", timeout_milliseconds=3000 }

-- ctrl+b, s: split pane
config.keys = {
  --pane
  {key="s", mods="LEADER", action=act.SplitVertical{domain="CurrentPaneDomain"}},
  {key="v", mods="LEADER", action=act.SplitHorizontal{domain="CurrentPaneDomain"}},
  {key="h", mods="LEADER", action=act.ActivatePaneDirection("Left")},
  {key="j", mods="LEADER", action=act.ActivatePaneDirection("Down")},
  {key="k", mods="LEADER", action=act.ActivatePaneDirection("Up")},
  {key="l", mods="LEADER", action=act.ActivatePaneDirection("Right")},
  {key="h", mods="LEADER|SHIFT", action=act.AdjustPaneSize{"Left", 5}},
  {key="j", mods="LEADER|SHIFT", action=act.AdjustPaneSize{"Down", 5}},
  {key="k", mods="LEADER|SHIFT", action=act.AdjustPaneSize{"Up", 5}},
  {key="l", mods="LEADER|SHIFT", action=act.AdjustPaneSize{"Right", 5}},
  {key="z", mods="LEADER", action="TogglePaneZoomState"},
  {key="c", mods="LEADER", action=act.SpawnTab("CurrentPaneDomain")},
  {key="LeftArrow", mods="LEADER", action=act.ActivateTabRelative(-1)},
  {key="RightArrow", mods="LEADER", action=act.ActivateTabRelative(1)},
  --tab
  {key="t", mods="LEADER", action=act.SpawnTab("CurrentPaneDomain")},
  {key="[", mods="LEADER", action=act.ActivateTabRelative(-1)},
  {key="]", mods="LEADER", action=act.ActivateTabRelative(1)},
  --{key="w", mods="CTRL", action=act.CloseCurrentTab{confirm=true}},
  --new window
  {key="n", mods="LEADER", action=act.SpawnWindow},
}

return config

