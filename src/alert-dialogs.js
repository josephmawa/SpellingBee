import Adw from "gi://Adw";

export function newGameAlert() {
  const alertDialog = new Adw.AlertDialog({
    heading: _("Start New Puzzle"),
    body: _("Are you sure you want to start a new puzzle?"),
    default_response: "new_puzzle",
    close_response: "close_dialog",
    presentation_mode: "floating",
  });

  alertDialog.add_response("new_puzzle", _("New Puzzle"));
  alertDialog.add_response("close_dialog", _("Close Dialog"));

  alertDialog.set_response_appearance(
    "new_puzzle",
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
    heading: _("Solve Puzzle"),
    body: _("Are you sure you want to see the solution for this puzzle?"),
    default_response: "solve_puzzle",
    close_response: "close_dialog",
    presentation_mode: "floating",
  });

  alertDialog.add_response("solve_puzzle", _("Solve Puzzle"));
  alertDialog.add_response("close_dialog", _("Close Dialog"));

  alertDialog.set_response_appearance(
    "solve_puzzle",
    Adw.ResponseAppearance.DESTRUCTIVE
  );
  alertDialog.set_response_appearance(
    "close_dialog",
    Adw.ResponseAppearance.SUGGESTED
  );

  return alertDialog;
}
export function goBackAlert() {
  const alertDialog = new Adw.AlertDialog({
    heading: _("Back To  Main View"),
    body: _("Are you sure you want to go back to the main view? This will start a new game"),
    default_response: "go_back",
    close_response: "close_dialog",
    presentation_mode: "floating",
  });

  alertDialog.add_response("go_back", _("Go Back"));
  alertDialog.add_response("close_dialog", _("Close Dialog"));

  alertDialog.set_response_appearance(
    "go_back",
    Adw.ResponseAppearance.DESTRUCTIVE
  );
  alertDialog.set_response_appearance(
    "close_dialog",
    Adw.ResponseAppearance.SUGGESTED
  );

  return alertDialog;
}
