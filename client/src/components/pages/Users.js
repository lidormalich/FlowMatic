import React, { useState, useEffect, Fragment } from "react";
import Navbar from "../partials/Navbar";
import Sidebar from "../partials/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList, faPlus } from "@fortawesome/free-solid-svg-icons";
import ReactDatatable from '@ashvin27/react-datatable';
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import UserAddModal from "../partials/UserAddModal";
import UserUpdateModal from "../partials/UserUpdateModal";
import { toast, ToastContainer } from "react-toastify";

const Users = () => {
    const auth = useSelector(state => state.auth);
    const dispatch = useDispatch();

    const columns = [
        {
            key: "_id",
            text: "מזהה",
            className: "id",
            align: "center",
            sortable: true,
        },
        {
            key: "name",
            text: "שם",
            className: "name",
            align: "center",
            sortable: true,
        },
        {
            key: "email",
            text: "אימייל",
            className: "email",
            align: "center",
            sortable: true
        },
        {
            key: "date",
            text: "תאריך",
            className: "date",
            align: "center",
            sortable: true
        },
        {
            key: "action",
            text: "פעולה",
            className: "action",
            width: 100,
            align: "center",
            sortable: false,
            cell: record => {
                return (
                    <Fragment>
                        <button
                            data-toggle="modal"
                            data-target="#update-user-modal"
                            className="btn btn-primary btn-sm"
                            onClick={() => editRecord(record)}
                            style={{ marginLeft: '5px' }}>
                            <i className="fa fa-edit"></i>
                        </button>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteRecord(record)}>
                            <i className="fa fa-trash"></i>
                        </button>
                    </Fragment>
                );
            }
        }
    ];

    const config = {
        page_size: 10,
        length_menu: [10, 20, 50],
        filename: "משתמשים",
        no_data_text: 'לא נמצאו משתמשים!',
        button: {
            excel: true,
            print: true,
            csv: true
        },
        language: {
            length_menu: "הצג _MENU_ תוצאות בכל דף",
            filter: "סנן תוצאות...",
            info: "מציג _START_ עד _END_ מתוך _TOTAL_ רשומות",
            pagination: {
                first: "ראשון",
                previous: "קודם",
                next: "הבא",
                last: "אחרון"
            }
        },
        show_length_menu: true,
        show_filter: true,
        show_pagination: true,
        show_info: true,
    };

    const [records, setRecords] = useState([]);
    const [currentRecord, setCurrentRecord] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        password2: '',
    });

    useEffect(() => {
        getData();
    }, []);

    const getData = () => {
        axios
            .post("/api/user-data")
            .then(res => {
                setRecords(res.data);
            })
            .catch(err => {
                console.error(err);
            });
    };

    const editRecord = (record) => {
        setCurrentRecord(record);
    };

    const deleteRecord = (record) => {
        axios
            .post("/api/user-delete", { _id: record._id })
            .then(res => {
                if (res.status === 200) {
                    toast(res.data.message, {
                        position: toast.POSITION.TOP_CENTER,
                    });
                    getData();
                }
            })
            .catch(err => {
                console.error(err);
            });
    };

    const pageChange = (pageData) => {
        console.log("OnPageChange", pageData);
    };

    return (
        <div>
            <Navbar />
            <div className="d-flex" id="wrapper">
                <Sidebar />
                <UserAddModal />
                <UserUpdateModal record={currentRecord} />
                <div id="page-content-wrapper" dir="rtl">
                    <div className="container-fluid">
                        {/* <button className="btn btn-link mt-3" id="menu-toggle">
                            <FontAwesomeIcon icon={faList} />
                        </button> */}
                        <button className="btn btn-outline-primary float-left mt-3 ml-2" data-toggle="modal" data-target="#add-user-modal">
                            <FontAwesomeIcon icon={faPlus} /> הוסף משתמש
                        </button>
                        <h1 className="mt-2 text-primary">רשימת משתמשים</h1>
                        <ReactDatatable
                            config={config}
                            records={records}
                            columns={columns}
                            onPageChange={pageChange}
                        />
                    </div>
                </div>
                <ToastContainer />
            </div>
        </div>
    );
};

export default Users;
