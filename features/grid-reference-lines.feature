Feature: Grid reference lines and coordinates
  As a player navigating a large or zoomed-out pattern
  I want major gridlines every 10 cells and coordinate labels along them
  So that I can tell where I am on the infinite grid at a glance

  Scenario Outline: A coordinate every 10 cells carries a major gridline
    Given a coordinate of <coordinate>
    Then it should be a major gridline

    Examples:
      | coordinate |
      | 0          |
      | 10         |
      | -10        |

  Scenario: A coordinate between the tens carries no major gridline
    Given a coordinate of 5
    Then it should not be a major gridline
