import React, { useEffect, useContext, useState } from "react";
import styled from "styled-components";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Checkbox from "components/Input/Checkbox";
import { WhiteSpace } from "antd-mobile";
import FormInput from "components/Input/FormInput";
import { Link } from "react-router-dom";
import InputLabel from "components/Input/Label";
import orgData from "../assets/data/createOrganisationProfile";
import {
  EditLayout,
  TitlePictureWrapper,
  FillEmptySpace,
  CustomLink,
  CustomForm,
  CustomHeading,
  CustomSubmitButton,
  OptionDiv,
  FormLayout,
  CheckBoxWrapper,
  Label,
  HelpWrapper,
  ToggleHeading,
  ProfilePicWrapper,
  StyledSelect,
  CustomEditAccountHeader,
  Background,
} from "../components/EditProfile/EditComponents";
import {
  fetchOrganisation,
  fetchOrganisationError,
  fetchOrganisationSuccess,
  updateOrganisation,
  updateOrganisationError,
  updateOrganisationSuccess,
} from "hooks/actions/organisationActions";
import axios from "axios";
import {
  OrganisationContext,
  withOrganisationContext,
} from "context/OrganisationContext";
import Marker from "../assets/create-profile-images/location-marker.svg";
import LocationInput from "../components/Input/LocationInput";
import ProfilePic from "components/Picture/ProfilePic";
import { getInitialsFromFullName } from "utils/userInfo";
import { validateEmail } from "../utils/validators";

const errorStyles = {
  color: "#FF5656",
  fontSize: "1.2rem",
  display: "block",
};

const InputWrapper = styled.div`
  margin: 2.2rem auto;
  width: 100%;
  position: relative;
`;

const NEEDS = {
  volunteers: "Volunteers",
  donations: "Donations",
  staff: "Staff",
  other: "Other",
};

function EditOrganisationAccount(props) {
  // TODO: integrate location w proper react-hook-forms use
  const organisationId = window.location.pathname.split("/")[2];
  const [location, setLocation] = useState({});
  const { orgProfileState, orgProfileDispatch } = useContext(
    OrganisationContext,
  );
  const {
    register,
    handleSubmit,
    control,
    errors,
    clearError,
    setError,
  } = useForm({
    mode: "change",
  });
  const { t } = useTranslation();
  const { loading, organisation } = orgProfileState;
  const { name, email, global, needs } = organisation || {};

  const handleLocationChange = (location) => {
    setLocation(location);
    clearError("location");
  };

  const onSubmit = async (formData) => {
    if (!location?.address) {
      // all location objects should have address (+coordinates), others optional
      return setError(
        "location",
        "required",
        t("profile.common.addressRequired"),
      );
    }
    Object.entries(NEEDS).map(([key, label]) => {
      if (formData.needs[key] === undefined) formData.needs[key] = needs[key];
    });
    formData.location = location;
    orgProfileDispatch(updateOrganisation());
    try {
      const res = await axios.patch(
        `/api/organisations/${organisationId}`,
        formData,
      );
      orgProfileDispatch(updateOrganisationSuccess(res.data));
      props.history.push(`/organisation/${res.data._id}`);
    } catch (err) {
      const message = err.response?.data?.message || err.message;
      const translatedErrorMessage = t([
        `error.${message}`,
        `error.http.${message}`,
      ]);
      orgProfileDispatch(
        updateOrganisationError(
          `${t("error.failedUpdatingOrgProfile")} ${translatedErrorMessage}`,
        ),
      );
    }
  };

  useEffect(() => {
    (async function fetchProfile() {
      orgProfileDispatch(fetchOrganisation());
      try {
        const res = await axios.get(`/api/organisations/${organisationId}`);
        setLocation(res.data.location);
        orgProfileDispatch(fetchOrganisationSuccess(res.data));
      } catch (err) {
        const message = err.response?.data?.message || err.message;
        const translatedErrorMessage = t([
          `error.${message}`,
          `error.http.${message}`,
        ]);
        orgProfileDispatch(
          fetchOrganisationError(
            `${t("error.failedLoadingProfile")} ${translatedErrorMessage}`,
          ),
        );
      }
    })();
  }, [orgProfileDispatch, organisationId]);

  const organisationInfo = {
    // label name, variable name, value
    "Organisation Name": [
      "name",
      name,
      t("profile.org.orgNameRequire"),
      false,
      {
        value: 60,
        message: t("profile.org.sixtyMaxLength"),
      },
    ],
    "Organisation Contact E-mail": [
      "email",
      email,
      t("profile.common.emailRequired"),
      true,
      {
        value: 30,
        message: t("profile.org.thirtyMaxLength"),
      },
    ],
  };

  const renderNeedSection = () => {
    if (organisation) {
      return (
        <div>
          {Object.entries(NEEDS).map(([key, label]) => (
            <CheckBoxWrapper key={key}>
              <Controller
                as={Checkbox}
                defaultChecked={needs[key]}
                name={`needs.${key}`}
                control={control}
                onChange={([event]) => event.target.checked}
              >
                <Label inputColor="#000000">{t("profile.org." + key)}</Label>
              </Controller>
            </CheckBoxWrapper>
          ))}
          <span style={errorStyles}>
            {errors.needs ? t("profile.common.selectOption") : ""}
          </span>
        </div>
      );
    }
  };

  const renderFormInputs = () => {
    return Object.entries(organisationInfo).map(([key, value]) => {
      return (
        <div
          key={
            key === "Organisation Name"
              ? t("profile.org.name")
              : t("profile.org.email")
          }
          style={{
            display: "flex",
            flexDirection: "column",
            marginBottom: "2rem",
          }}
        >
          <FormInput
            inputTitle={key}
            name={value[0]}
            defaultValue={value[1]}
            ref={register({
              required: value[2],
              maxLength: value[4],
              validate: value[3]
                ? (email) =>
                    validateEmail(email) || t("profile.common.invalidEmail")
                : null,
            })}
            error={errors[value[0]]}
            onChange={(event) => event.target.value}
          />
        </div>
      );
    });
  };
  const renderGlobalCheckBox = () => {
    if (organisation) {
      return (
        <HelpWrapper>
          <CheckBoxWrapper>
            <Controller
              as={Checkbox}
              name="global"
              defaultChecked={global}
              control={control}
              onChange={([event]) => event.target.checked}
            >
              <Label inputColor="#646464">{t("profile.org.globalOrg")}</Label>
            </Controller>
          </CheckBoxWrapper>
        </HelpWrapper>
      );
    }
  };

  const renderSelectItems = () => {
    if (organisation) {
      return (
        <div>
          <Controller
            as={
              <StyledSelect>
                {orgData.type.options.map((option, i) => (
                  <StyledSelect.Option key={i} value={option.text}>
                    {t("profile.org.types." + i)}
                  </StyledSelect.Option>
                ))}
              </StyledSelect>
            }
            defaultValue={organisation.type}
            control={control}
            onChange={([text]) => text}
            name="type"
          />
          <Controller
            as={
              <StyledSelect>
                {orgData.industry.options.map((option, i) => (
                  <StyledSelect.Option key={i} value={option.text}>
                    {t("profile.org.industries." + i)}
                  </StyledSelect.Option>
                ))}
              </StyledSelect>
            }
            defaultValue={organisation.industry}
            rules={{ required: true }}
            control={control}
            onChange={([text]) => text}
            name="industry"
          />
          <span style={errorStyles}>
            {errors.type || errors.industry
              ? t("profile.org.typeIndustryError")
              : ""}
          </span>
        </div>
      );
    }
  };

  const renderAddressInput = () => {
    if (organisation) {
      return (
        <InputWrapper>
          <InputLabel
            htmlFor="location"
            icon={Marker}
            label={t("profile.common.address")}
          />
          <LocationInput
            formError={errors.location}
            location={location}
            onLocationChange={handleLocationChange}
          />
        </InputWrapper>
      );
    } else {
      return <p>{t("comment.loading")}</p>;
    }
  };

  const renderProfilePicture = () => {
    if (organisation) {
      return (
        <ProfilePicWrapper>
          <ProfilePic
            resolution={"7680px"}
            noPic={true}
            initials={getInitialsFromFullName(name)}
          />
          {/* hide this until backend API is available
          <ChangePicButton>Change</ChangePicButton> */}
        </ProfilePicWrapper>
      );
    }
  };

  if (loading) return <div>"{t("profile.common.loading")}"</div>;
  return (
    <Background>
      <EditLayout>
        <TitlePictureWrapper>
          <CustomEditAccountHeader className="h4">
            {t("profile.org.editOrgProfile")}
          </CustomEditAccountHeader>
          <ToggleHeading>
            <CustomHeading level={4} className="h4">
              {t("profile.common.accountInfo")}
            </CustomHeading>
          </ToggleHeading>
          <FillEmptySpace />
          <ProfilePicWrapper>{renderProfilePicture()}</ProfilePicWrapper>
        </TitlePictureWrapper>
        <FormLayout>
          <OptionDiv>
            <CustomLink isSelected>
              <Link to={`/edit-organisation-account/${organisationId}`}>
                {t("profile.common.accountInfo")}
              </Link>
            </CustomLink>
            <CustomLink>
              <Link to={`/edit-organisation-profile/${organisationId}`}>
                {t("profile.common.profileInfo")}
              </Link>
            </CustomLink>
          </OptionDiv>
          <CustomForm>
            {renderFormInputs()}
            {renderAddressInput()}
            {renderGlobalCheckBox()}
            <WhiteSpace />
            <WhiteSpace />
            {renderSelectItems()}
            <Label>{t("profile.org.seeking")}</Label>
            <HelpWrapper>{renderNeedSection()}</HelpWrapper>
            <CustomSubmitButton primary="true" onClick={handleSubmit(onSubmit)}>
              {loading
                ? t("profile.common.saveChanges") + "..."
                : t("profile.common.saveChanges")}
            </CustomSubmitButton>
          </CustomForm>
        </FormLayout>
      </EditLayout>
    </Background>
  );
}

export default withOrganisationContext(EditOrganisationAccount);
