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
