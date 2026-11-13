# m **CONSUMER END.**

\- The first call worked and it returned data in the right format.
\- We had no issues with the API from Team 2.
\- They are good producers.

# **The producer End**

\- We had some issues as producer and to some degree frustrated our consumer team, but all has now been resolved.

| \#  | What broke (symptom)                                                                              | Root cause                                                                            | Fix                                                                                                    | Whose code, and who fixed it                           |
| :-- | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------- | :----------------------------------------------------- |
| 1\. | PATCH API could not be integrated into Consumer Team                                              | The functionality of update from there end was flagged as it was seen as unnecessary. | We as the producer created a POST API that allows customers from the consumer team to create an order. | Producer Team code broke, fixed by Producer Team.      |
| 2\. | GET API for returning meds sorted by review count was hindered by Row level Security on supa base | The RLS was not properly configured.                                                  | We ran an SQL Query in the table editor to allow READ on the table.                                    | Producer Team supa base broke, fixed by Producer Team. |
