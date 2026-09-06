Feature: Advancing the generation
  As a player stepping the board forward one generation at a time
  I want the Next generation control to be the only thing that advances the game
  So that a keystroke meant for something else never moves the board under me

  # THE NEGATIVE HALF OF THE ENTER CONTRACT, IN THE STATE NO OTHER SCENARIO
  # SETS UP. keyboard-grid-navigation.feature already says that Enter on a
  # focused CELL toggles that cell and leaves the generation where it was. This
  # says the same thing about the state where the keyboard is on nothing at
  # all, and the two are not the same claim: a shortcut guarded on "no cell has
  # focus" satisfies that scenario exactly and fails this one.
  Scenario: Enter advances nothing while the keyboard is on nothing
    Given an empty grid
    And nothing has keyboard focus
    When I press Enter
    Then the game should still be on its first generation

  # THE POSITIVE HALF, AND "EXACTLY ONE GENERATION" IS THE WHOLE CLAIM. That
  # Enter on the focused control advances the game at all is the control's own
  # activation; that it advances the game once is what a second listener
  # stacked on top of it would break, leaving the game on its third generation
  # where the contract says second.
  Scenario: Enter on the focused Next generation control advances the game exactly one generation
    Given an empty grid
    And the Next generation control has keyboard focus
    When I press Enter
    Then the game should be on its second generation
