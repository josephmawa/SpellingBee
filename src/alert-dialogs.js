import Adw from "gi://Adw";

export function newGameAlert() {
  const alertDialog = new Adw.AlertDialog({
    heading: _("Start New Game"),
    body: _("Are you sure you want to start a new game?"),
    default_response: "new_game",
    close_response: "close_dialog",
    presentation_mode: "floating",
  });

  alertDialog.add_response("new_game", _("New Game"));
  alertDialog.add_response("close_dialog", _("Close Dialog"));

  alertDialog.set_response_appearance(
    "new_game",
    Adw.ResponseAppearance.DESTRUCTIVE
  );
  alertDialog.set_response_appearance(
    "close_dialog",
    Adw.ResponseAppearance.SUGGESTED
  );

  return alertDialog;
}

export function solveGameAlert() {
  const alertDialog = new Adw.AlertDialog({
    heading: _("Solve Game"),
    body: _("Are you sure you want to solve this game?"),
    default_response: "solve_game",
    close_response: "close_dialog",
    presentation_mode: "floating",
  });

  alertDialog.add_response("solve_game", _("Solve Game"));
  alertDialog.add_response("close_dialog", _("Close Dialog"));

  alertDialog.set_response_appearance(
    "solve_game",
    Adw.ResponseAppearance.DESTRUCTIVE
  );
  alertDialog.set_response_appearance(
    "close_dialog",
    Adw.ResponseAppearance.SUGGESTED
  );

  return alertDialog;
}
