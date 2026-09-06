Feature: Pattern library
  As a player who wants to experiment with classic Game of Life patterns
  I want to choose a named pattern from a categorized library and stamp it onto the grid
  So that I don't have to toggle each cell of a well-known pattern by hand

  # Cell coordinates are the classic shapes for each pattern, listed relative
  # to the top-left corner of the pattern's own bounding box (0, 0).
  Scenario Outline: Each pattern in the library has a category and a defined shape
    Given the "<pattern>" pattern
    Then it should be listed under the "<category>" category
    And its live cells relative to the top-left corner of its bounding box should be <cells>

    Examples:
      | pattern                      | category    | cells                                                                                                                                                                                                                                                                                                                                                                                                              |
      | Block                        | Still Life  | (0, 0), (1, 0), (0, 1), (1, 1)                                                                                                                                                                                                                                                                                                                                                                                     |
      | Beehive                      | Still Life  | (1, 0), (2, 0), (0, 1), (3, 1), (1, 2), (2, 2)                                                                                                                                                                                                                                                                                                                                                                     |
      | Blinker                      | Oscillators | (0, 0), (1, 0), (2, 0)                                                                                                                                                                                                                                                                                                                                                                                             |
      | Toad                         | Oscillators | (1, 0), (2, 0), (3, 0), (0, 1), (1, 1), (2, 1)                                                                                                                                                                                                                                                                                                                                                                     |
      | Beacon                       | Oscillators | (0, 0), (1, 0), (0, 1), (1, 1), (2, 2), (3, 2), (2, 3), (3, 3)                                                                                                                                                                                                                                                                                                                                                     |
      | Pulsar                       | Oscillators | (2, 0), (3, 0), (4, 0), (8, 0), (9, 0), (10, 0), (0, 2), (5, 2), (7, 2), (12, 2), (0, 3), (5, 3), (7, 3), (12, 3), (0, 4), (5, 4), (7, 4), (12, 4), (2, 5), (3, 5), (4, 5), (8, 5), (9, 5), (10, 5), (2, 7), (3, 7), (4, 7), (8, 7), (9, 7), (10, 7), (0, 8), (5, 8), (7, 8), (12, 8), (0, 9), (5, 9), (7, 9), (12, 9), (0, 10), (5, 10), (7, 10), (12, 10), (2, 12), (3, 12), (4, 12), (8, 12), (9, 12), (10, 12) |
      | Glider                       | Spaceships  | (1, 0), (2, 1), (0, 2), (1, 2), (2, 2)                                                                                                                                                                                                                                                                                                                                                                             |
      | LWSS (Lightweight Spaceship) | Spaceships  | (1, 0), (4, 0), (0, 1), (0, 2), (4, 2), (0, 3), (1, 3), (2, 3), (3, 3)                                                                                                                                                                                                                                                                                                                                             |

  Scenario: Placing a pattern anchors its top-left corner at the target cell
    Given an empty grid
    When I place the "Block" pattern with its top-left corner at (5, 5)
    Then the cell at (5, 5) should be alive
    And the cell at (6, 5) should be alive
    And the cell at (5, 6) should be alive
    And the cell at (6, 6) should be alive

  # The keyboard route and the pointer route mean the same thing with the same
  # pattern armed: this scenario is the keyboard half of the stamp above, and it
  # lives here rather than in keyboard-grid-navigation.feature because arming a
  # pattern is this feature's vocabulary. The focus steps it borrows are defined
  # once, in keyboard-grid-navigation.ts.
  Scenario: Pressing Enter with a pattern armed stamps it at the focused cell
    Given an empty grid
    And I have armed the "Block" pattern
    And the cell at (5, 5) has keyboard focus
    When I press Enter
    Then the cell at (5, 5) should be alive
    And the cell at (6, 5) should be alive
    And the cell at (5, 6) should be alive
    And the cell at (6, 6) should be alive

  Scenario: Placing a pattern merges with existing live cells rather than replacing them
    Given a live cell at (20, 20)
    When I place the "Block" pattern with its top-left corner at (5, 5)
    Then the cell at (20, 20) should be alive
    And the cell at (5, 5) should be alive

  Scenario: Placing a pattern over an already-live cell keeps it alive rather than toggling it off
    Given a live cell at (5, 5)
    When I place the "Block" pattern with its top-left corner at (5, 5)
    Then the cell at (5, 5) should be alive
    And the cell at (6, 5) should be alive
    And the cell at (5, 6) should be alive
    And the cell at (6, 6) should be alive

  # STAMPING USES THE ARMED PATTERN UP, which is what makes the route between
  # two patterns go back through the library at all (see the scenario below).
  # (12, 12) is clear of the Block stamped at (5, 5), so its three neighbours
  # staying dead is what says a single cell was toggled rather than a second
  # copy of the pattern stamped -- and (5, 5) staying alive says the first
  # stamp was not disturbed by the click that followed it.
  Scenario: A stamped pattern is used up, so the next click toggles a single cell
    Given an empty grid
    And I have armed the "Block" pattern
    And I stamp the armed pattern with its top-left corner at (5, 5)
    When I toggle the cell at (12, 12)
    Then the cell at (12, 12) should be alive
    And the cell at (13, 12) should be dead
    And the cell at (12, 13) should be dead
    And the cell at (13, 13) should be dead
    And the cell at (5, 5) should be alive

  # ARMING IS SINGLE-SHOT, so the only route from one armed pattern to another
  # is back through the library, and what this scenario pins is that the SECOND
  # choice is the one that gets stamped. Glider anchored at (5, 5) has no cell
  # at its own anchor, so (5, 5) staying dead is what says the discarded Block
  # was not stamped -- by itself, and whether or not the Glider was stamped too.
  # (6, 5) is deliberately not asserted: both patterns cover it, so it
  # discriminates nothing.
  Scenario: Arming a second pattern replaces the first, and it is the second that is stamped
    Given an empty grid
    And I have armed the "Block" pattern
    And I have armed the "Glider" pattern instead
    When I stamp the armed pattern with its top-left corner at (5, 5)
    Then the cell at (5, 7) should be alive
    And the cell at (7, 6) should be alive
    And the cell at (5, 5) should be dead
    And the cell at (5, 6) should be dead
    And the cell at (6, 6) should be dead

  # WHERE WOULD THIS LAND. The preview is the app's only answer to that
  # question before a click is made, so it has to track the aim rather than
  # stay where it was first shown. Block is chosen because its four cells at
  # (5, 5) and its four at (12, 12) are DISJOINT: a preview that stayed behind
  # is caught from both directions at once, every cell this scenario names
  # being absent and every cell on screen being unnamed.
  #
  # ONE When, NOT TWO, and the reason is the claim's own shape rather than a
  # lint accommodation. "Follows the aim" relates two aims, but only the second
  # is the act -- the first is the state the act has to change, which is what a
  # Given is for, exactly as the armed pattern is. The split-into-two-scenarios
  # shape the cancel pair needed is not wanted here: nothing has to be observed
  # between the two aims, so there is no observation for a Then to make in the
  # middle.
  Scenario: Aiming at a different cell moves the preview there rather than leaving it behind
    Given an empty grid
    And I have armed the "Block" pattern
    And I am aiming it at the cell at (5, 5)
    When I aim it at the cell at (12, 12) instead
    Then the pattern preview should cover exactly (12, 12), (13, 12), (12, 13), (13, 13)

  Scenario: Pressing Escape while aiming a pattern clears its preview
    Given an empty grid
    And I have armed the "Glider" pattern
    And I am aiming it at the cell at (5, 5)
    When I press Escape
    Then no pattern preview should be shown

  # The consequence of the cancel above, stated as the user would meet it: a
  # cancelled pattern is not merely invisible, the grid is back to toggling one
  # cell at a time. (6, 5) and (5, 7) are Glider cells relative to (5, 5), so
  # either coming to life would mean the pattern was still armed.
  Scenario: Cancelling an armed pattern leaves the next click a plain single-cell toggle
    Given an empty grid
    And I have armed the "Glider" pattern
    And I press Escape
    When I toggle the cell at (5, 5)
    Then the cell at (5, 5) should be alive
    And the cell at (6, 5) should be dead
    And the cell at (5, 7) should be dead

  # THE OTHER ROUTE OUT OF A PLACEMENT. The Patterns control is a toggle, so
  # the obvious wrong implementation reopens the library from here; what it
  # must do instead is put the armed pattern down.
  #
  # TWO SCENARIOS BECAUSE THERE ARE TWO ACTS WITH AN OBSERVATION THAT MUST SIT
  # BETWEEN THEM. The press has to be observed -- library shut, preview gone --
  # before the next click happens, and that click is a second act. One scenario
  # cannot hold both: only-one-when allows a single When, and
  # keywords-in-logical-order forbids the interleaved reading that would state
  # them in order. Measured rather than preferred: with the click as the single
  # When, an implementation that reopens the library is reported at the CELL
  # clause and never at the library clause, because the reopened dialog
  # swallows the grid click as an outside-click dismissal -- so the cell stays
  # dead AND the library is shut again by the time anything looks at it,
  # leaving the clause the scenario exists for unable to fail. Split, both
  # halves can fail: removing the cancel branch reds the first at its library
  # clause and the second at its alive clause.
  #
  # THE AIMING Given IS REQUIRED IN BOTH, for different reasons. The first
  # needs it so that "no pattern preview should be shown" cannot pass
  # vacuously against a preview that never rendered; the second needs it
  # because the press under test has to cancel a live aim.
  Scenario: Clicking Patterns while a pattern is armed does not reopen the library
    Given an empty grid
    And I have armed the "Glider" pattern
    And I am aiming it at the cell at (12, 12)
    When I click the Patterns control again
    Then the pattern library should not be open
    And no pattern preview should be shown

  # (12, 12) is the anchor a Glider would have been stamped at, and a Glider
  # has no cell at its own anchor -- so (12, 12) coming alive is what says a
  # single cell was toggled, while (13, 12) and (12, 14), both Glider cells
  # relative to that anchor, staying dead say the pattern was genuinely
  # disarmed rather than merely hidden.
  Scenario: Cancelling with the Patterns control leaves the next click a plain single-cell toggle
    Given an empty grid
    And I have armed the "Glider" pattern
    And I am aiming it at the cell at (12, 12)
    And I click the Patterns control again
    When I toggle the cell at (12, 12)
    Then the cell at (12, 12) should be alive
    And the cell at (13, 12) should be dead
    And the cell at (12, 14) should be dead
