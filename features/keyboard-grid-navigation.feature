Feature: Keyboard grid navigation
  As a player who works from the keyboard or with a screen reader
  I want a focus cursor I can move around the grid and toggle the cell it rests on
  So that I can build and edit patterns without a pointing device

  Scenario: Tabbing onto a freshly opened grid stops on the cell at the center of the default view
    Given an empty grid
    When I tab forward onto the grid
    Then the focused cell should be (0, 0)

  Scenario: The whole grid is a single stop in the tab order
    Given an empty grid
    And the grid has keyboard focus
    When I tab forward once more
    Then no cell should be focused

  Scenario: Coming back to the grid returns to the cell that last had focus
    Given an empty grid
    And the cell at (4, -2) has keyboard focus
    When I tab away from the grid and back
    Then the focused cell should be (4, -2)

  # The click-route twin of the scenario above it: same When, same Then, and the
  # only difference is how the cell became current. Coming back presupposes
  # leaving, and a click leaves the focus ON the clicked button -- so a single
  # forward Tab cannot be the return trip, it is the departure.
  Scenario: Clicking a cell makes it the cell the keyboard comes back to
    Given an empty grid
    And I have clicked the cell at (7, 2)
    When I tab away from the grid and back
    Then the focused cell should be (7, 2)

  # Every Examples column in this file has a name of its own, including the two
  # that carry the same kind of value as another table's: npm run
  # acceptance-mutation keys a mutation site by <feature>:<row>:<column>, so two
  # tables sharing a column name collide on that key and it refuses to plan the
  # run at all. Hence <arrow> here and <direction> in the announcement outline
  # below -- the two steps still read identically once a row is substituted in.
  Scenario Outline: An arrow key moves the focus one cell in its own direction
    Given an empty grid
    And the cell at (0, 0) has keyboard focus
    When I move the focus <arrow>
    Then the focused cell should be (<x>, <y>)

    Examples:
      | arrow | x  | y  |
      | right | 1  | 0  |
      | left  | -1 | 0  |
      | down  | 0  | 1  |
      | up    | 0  | -1 |

  Scenario Outline: Home and End jump to the edge of the view along the same row
    Given an empty grid
    And the cell at (0, 0) has keyboard focus
    When I press <key>
    Then the focused cell should be the furthest cell in view to the <edge> on the same row

    Examples:
      | key  | edge  |
      | Home | left  |
      | End  | right |

  Scenario: Moving the focus past the edge of the view brings that cell into view
    Given an empty grid
    And the cell at the left edge of the view has keyboard focus
    When I move the focus left
    Then the focused cell should be one cell further left and still in view

  Scenario: Pressing Enter brings the focused cell to life
    Given an empty grid
    And the cell at (2, 3) has keyboard focus
    When I press Enter
    Then the cell at (2, 3) should be alive

  Scenario: Pressing the space bar kills the focused live cell
    Given a live cell at (2, 3)
    And the cell at (2, 3) has keyboard focus
    When I press the space bar
    Then the cell at (2, 3) should be dead

  Scenario Outline: Landing on a cell announces where it is and whether it is alive
    Given a live cell at (1, 0)
    And the cell at (0, 0) has keyboard focus
    When I move the focus <direction>
    Then the grid should announce the cell at (<announced x>, <announced y>) as <state>

    Examples:
      | direction | announced x | announced y | state |
      | right     | 1           | 0           | alive |
      | left      | -1          | 0           | dead  |
