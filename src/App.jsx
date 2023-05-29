import "./App.css";

// import awsconfig from "./aws-exports";
import { Amplify, Auth, API, graphqlOperation, Analytics } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { listUsers } from "./graphql/queries";
import { useState, useEffect } from "react";
import { createUser, updateUser } from "./graphql/mutations";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

const initialState = {
  firstName: "",
  secondName: "",
  occupation: "",
  country: "",
};

const Admin = () => {
  const [users, setUsers] = useState([]);
  const [userEmail, setUserEmail] = useState();
  const [userCount, setUserCount] = useState(0);
  const [uniqueCountries, setUniqueCountries] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const userData = await API.graphql(graphqlOperation(listUsers));
      const userList = userData.data.listUsers.items;
      console.log("user list", userList);
      setUsers(userList);
      const userCount = userList.length;
      setUserCount(userCount);
      const uniqueCountries = Array.from(
        new Set(userList.map((user) => user.country))
      );
      setUniqueCountries(uniqueCountries);
    } catch (error) {
      console.log("error on fetching users", error);
    }
  };

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#282c34",
    },
    content: {
      width: 500,
      padding: 20,
      backgroundColor: "#f1f1f1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      width: 300,
      margin: 20,
    },

    button: {
      backgroundColor: "black",
      color: "white",
      outline: "none",
      fontSize: 18,
      padding: "12px 12px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: 20,
    },
    tableHead: {
      backgroundColor: "#333",
      color: "#fff",
    },
    tableCell: {
      padding: 10,
      border: "1px solid #ddd",
    },
    cards: {
      width: "100%",
      display: "flex",
      justifyContent: "center",
      marginTop: 20,
    },
    card: {
      width: 200,
      padding: 20,
      margin: 10,
      backgroundColor: "#f1f1f1",
      boxShadow: "0 0 5px rgba(0, 0, 0, 0.3)",
      borderRadius: 5,
      textAlign: "center",
    },
  };

  return (
    <div style={styles.container}>
      <Authenticator>
        {({ signOut }) => (
          <div style={styles.content}>
            <h2>Admin Dashboard</h2>
            <div style={styles.signout}>
              <button onClick={signOut}>Sign out</button>
            </div>

            <table style={styles.table}>
              <thead style={styles.tableHead}>
                <tr>
                  <th style={styles.tableCell}>First Name</th>
                  <th style={styles.tableCell}>Last Name</th>
                  <th style={styles.tableCell}>Occupation</th>
                  <th style={styles.tableCell}>Country</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id ? user.id : index}>
                    <td style={styles.tableCell}>{user.firstName}</td>
                    <td style={styles.tableCell}>{user.secondName}</td>
                    <td style={styles.tableCell}>{user.occupation}</td>
                    <td style={styles.tableCell}>{user.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.cards}>
              <div style={styles.card}>
                <h3>Total Users:</h3>
                <p>{userCount}</p>
              </div>
              <div style={styles.card}>
                <h3>Count of unique countries</h3>

                <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                  {uniqueCountries.map((country, index) => {
                    const countryCount = users.filter(
                      (user) => user.country === country
                    ).length;
                    return (
                      <li key={index}>
                        {country} - {countryCount}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </Authenticator>
    </div>
  );
};

const User = () => {
  const [formState, setFormState] = useState(initialState);
  const [users, setUsers] = useState([]);
  const [userEmail, setUserEmail] = useState();

  useEffect(() => {
    fetchUsers();
    getUserEmail();
  }, []);

  function setInput(key, value) {
    setFormState({ ...formState, [key]: value });
  }

  const getUserEmail = async () => {
    try {
      const { attributes } = await Auth.currentAuthenticatedUser();
      console.log(attributes);
      const email = attributes.email;
      //console.log(email);
      setUserEmail(email);
    } catch (error) {
      console.log("error getting user data", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const userData = await API.graphql(graphqlOperation(listUsers));
      const userList = userData.data.listUsers.items;
      console.log("user list", userList);
      setUsers(userList);
    } catch (error) {
      console.log("error on fetching users", error);
    }
  };

  async function addUser() {
    try {
      if (
        !formState.firstName ||
        !formState.secondName ||
        !formState.occupation ||
        !formState.country
      ) {
        return;
      }

      const email = userEmail;
      const existingUser = users.find((user) => user.userName === email);

      const input = {
        firstName: formState.firstName,
        secondName: formState.secondName,
        occupation: formState.occupation,
        country: formState.country,
        userName: existingUser ? existingUser.email : email,
      };

      if (existingUser) {
        input.id = existingUser.id;
        const updatedUser = { ...existingUser, ...formState };
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.userName === email ? updatedUser : user
          )
        );
        setFormState(initialState);
        await API.graphql(
          graphqlOperation(updateUser, { input, condition: null })
        );
      } else {
        setUsers((prevUsers) => [...prevUsers, input]);
        setFormState(initialState);
        await API.graphql(
          graphqlOperation(createUser, { input, condition: null })
        );
      }
      //sendEmailToUser(email);
      setFormState(initialState);
    } catch (err) {
      console.log("error creating/updating user:", err);
    }
  }

  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#282c34",
    },
    content: {
      width: 500,
      padding: 20,
      backgroundColor: "#f1f1f1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      width: 300,
      margin: 20,
    },

    button: {
      backgroundColor: "black",
      color: "white",
      outline: "none",
      fontSize: 18,
      padding: "12px 12px",
    },
  };

  return (
    <div style={styles.container}>
      <Authenticator>
        {({ signOut }) => (
          <div style={styles.content}>
            <p>Hey {userEmail}, welcome to The Gold Grid</p>
            <div style={styles.signout}>
              <button onClick={signOut}>Sign out</button>
            </div>
            <div>
              <input
                onChange={(event) => setInput("firstName", event.target.value)}
                style={styles.input}
                value={formState.firstName}
                placeholder='First Name'
              />
            </div>
            <div>
              <input
                onChange={(event) => setInput("secondName", event.target.value)}
                style={styles.input}
                value={formState.secondName}
                placeholder='Second Name'
              />
            </div>
            <div>
              <input
                onChange={(event) => setInput("occupation", event.target.value)}
                style={styles.input}
                value={formState.occupation}
                placeholder='Occupation'
              />
            </div>
            <div>
              <input
                onChange={(event) => setInput("country", event.target.value)}
                style={styles.input}
                value={formState.country}
                placeholder='Country'
              />
            </div>
            <div>
              <button style={styles.button} onClick={addUser}>
                Create User
              </button>
            </div>
            {/* {users.map((user, index) => (
            <div key={user.id ? user.id : index} style={styles.user}>
              <p style={styles.todoName}>{user.firstName}</p>
              <p style={styles.todoDescription}>{user.secondName}</p>
            </div>
          ))} */}
          </div>
        )}
      </Authenticator>
    </div>
  );
};

const Login = () => {
  const [userEmail, setUserEmail] = useState();

  useEffect(() => {
    getUserEmail();
  }, []);

  const getUserEmail = async () => {
    try {
      const { attributes } = await Auth.currentAuthenticatedUser();
      console.log(attributes);
      const email = attributes.email;
      setUserEmail(email);
    } catch (error) {
      console.log("error getting user data", error);
    }
  };

  return (
    <div>
      <h1>Logging in...</h1>
      <p>Hey {userEmail}, welcome to The Gold Grid</p>
    </div>
  );
};

const Root = () => {
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    getUserEmail();
  }, []);

  const getUserEmail = async () => {
    try {
      const { attributes } = await Auth.currentAuthenticatedUser();
      setUserEmail(attributes.email);
    } catch (error) {
      console.log("error getting user data", error);
    }
  };

  return userEmail ? (
    userEmail === "leslienarh@gmail.com" ? (
      <Admin />
    ) : (
      <User />
    )
  ) : (
    <Login />
  );
};

const App = () => {
  const styles = {
    container: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#282c34",
    },
    content: {
      width: 500,
      padding: 20,
      backgroundColor: "#f1f1f1",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
    input: {
      width: 300,
      margin: 20,
    },
    button: {
      backgroundColor: "black",
      color: "white",
      outline: "none",
      fontSize: 18,
      padding: "12px 12px",
    },
  };

  return (
    <Router>
      <div style={styles.container}>
        <Authenticator>
          <Routes>
            {/* <Route path='/login' element={<Login />} /> */}
            <Route path='/' exact element={<Root />} />
            <Route path='/admin' element={<Admin />} />
            <Route path='/user' element={<User />} />
          </Routes>
        </Authenticator>
      </div>
    </Router>
  );
};

export default App;
