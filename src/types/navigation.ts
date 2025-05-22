export type RootStackParamList = {
  MainTabs: MainTabParamList;
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  Register: undefined;
  UserForm: undefined;
  Add: undefined;
  AllTransactions: undefined;
  Profile: undefined;
  Notifications: undefined;
  ManageAccounts: undefined;
  ManageCategories: undefined;
  Budget: undefined;
  Database: undefined;
  IncomeDetails: undefined;
  ExpenseDetails: undefined;
  BudgetCategoryDetails: { budget: any; category: any };
};

export type MainTabParamList = {
  Home: undefined;
  Budget: undefined;
  Profile: undefined;
  Null: undefined;
  Add: undefined;
  Stats: undefined;
  AI: undefined;
};
